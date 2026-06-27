// ==========================================
//         INVENTORY ROUTES (HW + PURCHASES)
// ==========================================
// Provides inventory data using hardware, purchases, and vendors tables only

const express = require("express");
const router = express.Router();
const PDFDocument = require('pdfkit');

const Hardware = require("../model/hardware");
const Purchase = require("../model/purchases");
const Vendor = require("../model/vendors");
const Allocation = require("../model/allocation");
const HardwareRequest = require('../model/HardwareRequest');

// Helper to compute stock status label
function getStatusLabel(stock) {
	if (stock === 0) return "Out of Stock";
	if (stock < 1) return "Low Stock";
	return "In Stock";
}

// ==========================================
//      INVENTORY DEMAND PREDICTION ROUTE
// ==========================================
// GET /api/inventory/predict?months=6
// Returns predicted demand for each hardware item for next month using moving average
router.get('/predict', async (req, res) => {
	try {
		const months = parseInt(req.query.months, 10) || 6;
		// Get all hardware items
		const hardwareItems = await Hardware.find();
		// For each hardware, aggregate requests by month
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
		const predictions = [];
		for (const hw of hardwareItems) {
			// Get monthly request counts for this hardware
			const reqs = await HardwareRequest.aggregate([
				{ $match: { asset_id: hw.asset_id, order_date: { $gte: start } } },
				{
					$group: {
						_id: { year: { $year: "$order_date" }, month: { $month: "$order_date" } },
						count: { $sum: "$quantity" }
					}
				},
				{ $sort: { '_id.year': 1, '_id.month': 1 } }
			]);
			// Moving average (simple)
			const total = reqs.reduce((sum, r) => sum + r.count, 0);
			const avg = reqs.length ? total / reqs.length : 0;
			predictions.push({
				asset_id: hw.asset_id,
				name: hw.name,
				model: hw.model,
				predicted_next_month: Math.round(avg)
			});
		}
		res.json({ months, predictions });
	} catch (err) {
		res.status(500).json({ error: 'Prediction failed', details: err.message });
	}
});

// ==========================================
//      GET ALL INVENTORY WITH PAGINATION
// ==========================================
// GET /api/inventory?page=1&limit=5&search=&item=&supplier=
router.get("/", async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 5;
		const search = req.query.search || "";
		const itemFilter = req.query.item || "All";
		const supplierFilter = req.query.supplier || "All";

		// Base hardware filter
		const hwFilter = {};

		// Item name filter
		if (itemFilter && itemFilter !== "All") {
			hwFilter.name = itemFilter;
		}

		// Fetch all hardware matching filters (small dataset expected)
		const hardwareItems = await Hardware.find(hwFilter).sort({ asset_id: 1 });

		// Group by name+model to avoid duplicates
		const groupedItems = new Map();

		for (const item of hardwareItems) {
			const key = `${item.name}|||${item.model}`;
			if (!groupedItems.has(key)) {
				groupedItems.set(key, item);
			}
		}

		// Enrich with stock (purchased - allocated) and vendor (latest purchase seller)
		const enriched = await Promise.all(
			Array.from(groupedItems.values()).map(async (item) => {
				// Total purchased
				const purchasesAgg = await Purchase.aggregate([
					{ $match: { asset_name: item.name, model_name: item.model } },
					{ $group: { _id: null, totalQty: { $sum: "$quantity" } } }
				]);
				const totalPurchased = purchasesAgg.length ? purchasesAgg[0].totalQty : 0;

				// Total allocated (status: 'allocated')
				const allocatedCount = await Allocation.countDocuments({
					status: "allocated",
					// Join on asset name and model by looking up hardware
					asset_id: { $in: (await Hardware.find({ name: item.name, model: item.model }, { asset_id: 1 }).lean()).map(h => h.asset_id) }
				});

				const stock = totalPurchased - allocatedCount;

				const lastPurchase = await Purchase.findOne({ asset_name: item.name, model_name: item.model })
					.sort({ arrival_date: -1 })
					.lean();

				const vendor = lastPurchase
					? await Vendor.findOne({ seller_id: lastPurchase.seller_id }).lean()
					: null;

				return {
					_id: item._id,
					name: item.name,
					model: item.model,
					stock,
					seller: vendor ? vendor.seller_name : "N/A",
					vendor_id: vendor ? vendor.seller_id : null
				};
			})
		);

		// Apply filters
		let filtered = enriched;

		// Apply supplier filter
		if (supplierFilter !== "All") {
			filtered = filtered.filter((item) => item.seller === supplierFilter);
		}

		// Apply search filter (after enrichment to include supplier in search)
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter((item) =>
				item.name.toLowerCase().includes(searchLower) ||
				item.model.toLowerCase().includes(searchLower) ||
				item.seller.toLowerCase().includes(searchLower)
			);
		}

		const total = filtered.length;
		const pages = Math.ceil(total / limit) || 1;
		const startIdx = (page - 1) * limit;
		const paged = filtered.slice(startIdx, startIdx + limit);

		res.json({
			items: paged,
			total,
			page,
			limit,
			pages
		});
	} catch (err) {
		console.error("❌ Inventory API Error:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      GET FILTER OPTIONS
// ==========================================
// GET /api/inventory/filter-options
router.get("/filter-options", async (req, res) => {
	try {
		// Get unique item names
		const hardwareItems = await Hardware.find({}, { name: 1 }).lean();
		const items = [...new Set(hardwareItems.map((i) => i.name))].sort();

		// Get unique suppliers from vendors
		const vendors = await Vendor.find({}, { seller_name: 1 }).lean();
		const suppliers = [...new Set(vendors.map((v) => v.seller_name))].sort();

		res.json({ items, suppliers });
	} catch (err) {
		console.error("Error fetching filter options:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      GET FORM OPTIONS (FOR NEW ITEM FORM)
// ==========================================
// GET /api/inventory/form-options
router.get("/form-options", async (req, res) => {
	try {
		// Get all unique item names and their models
		const hardwareItems = await Hardware.find({}, { name: 1, model: 1 }).lean();
		const itemsMap = new Map();

		hardwareItems.forEach(item => {
			if (!itemsMap.has(item.name)) {
				itemsMap.set(item.name, []);
			}
			if (!itemsMap.get(item.name).includes(item.model)) {
				itemsMap.get(item.name).push(item.model);
			}
		});

		const items = Array.from(itemsMap.keys()).sort();
		const models = [...new Set(hardwareItems.map(i => i.model))].sort();

		// Get all vendors with their details (fetch ALL fields to ensure gst_number is included)
		const vendors = await Vendor.find({}).lean();
		console.log('📦 Found vendors:', vendors.length);

		const vendorsByName = vendors.reduce((acc, v) => {
			acc[v.seller_name] = {
				seller_id: v.seller_id,
				phone: v.phone,
				gst_number: v["GST Number"]
			};
			return acc;
		}, {});

		const supplierNames = vendors.map(v => v.seller_name).sort();
		const sellerIds = vendors.map(v => v.seller_id).sort();


		res.json({
			items,
			models,
			supplierNames,
			sellerIds,
			vendorsByName,
			itemModelsMap: Object.fromEntries(itemsMap)
		});
	} catch (err) {
		console.error("Error fetching form options:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      EXPORT INVENTORY DATA
// ==========================================
// GET /api/inventory/export?item=&supplier=&search=
router.get("/export", async (req, res) => {
	try {
		const itemFilter = req.query.item || "All";
		const supplierFilter = req.query.supplier || "All";
		const search = req.query.search || "";
		const format = req.query.format || "csv";

		// Base hardware filter
		const hwFilter = {};

		// Item name filter
		if (itemFilter && itemFilter !== "All") {
			hwFilter.name = itemFilter;
		}

		// Fetch all hardware matching filters
		const hardwareItems = await Hardware.find(hwFilter).sort({ asset_id: 1 });

		// Group by name+model to avoid duplicates
		const groupedItems = new Map();

		for (const item of hardwareItems) {
			const key = `${item.name}|||${item.model}`;
			if (!groupedItems.has(key)) {
				groupedItems.set(key, item);
			}
		}

		// Enrich with stock (sum of purchases) and vendor (latest purchase seller)
		const enriched = await Promise.all(
			Array.from(groupedItems.values()).map(async (item) => {
				const purchasesAgg = await Purchase.aggregate([
					{ $match: { asset_name: item.name, model_name: item.model } },
					{ $group: { _id: null, totalQty: { $sum: "$quantity" } } }
				]);

				const stock = purchasesAgg.length ? purchasesAgg[0].totalQty : 0;

				const lastPurchase = await Purchase.findOne({ asset_name: item.name, model_name: item.model })
					.sort({ arrival_date: -1 })
					.lean();

				const vendor = lastPurchase
					? await Vendor.findOne({ seller_id: lastPurchase.seller_id }).lean()
					: null;

				return {
					_id: item._id,
					name: item.name,
					model: item.model,
					stock,
					seller: vendor ? vendor.seller_name : "N/A",
					vendor_id: vendor ? vendor.seller_id : null,
					status: getStatusLabel(stock)
				};
			})
		);

		// Apply filters
		let filtered = enriched;

		// Apply supplier filter
		if (supplierFilter !== "All") {
			filtered = filtered.filter((item) => item.seller === supplierFilter);
		}

		// Apply search filter
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter((item) =>
				item.name.toLowerCase().includes(searchLower) ||
				item.model.toLowerCase().includes(searchLower) ||
				item.seller.toLowerCase().includes(searchLower)
			);
		}

		// Prepare CSV data
		if (format === "csv") {
			const headers = ["Item Name", "Model", "Stock Level", "Supplier"];
			const rows = filtered.map(item => [
				`"${item.name}"`,
				`"${item.model}"`,
				item.stock,
				`"${item.seller}"`
			]);

			const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
			res.setHeader("Content-Type", "text/csv");
			res.setHeader("Content-Disposition", "attachment; filename=inventory_export.csv");
			res.send(csv);
		}
		// Prepare Excel data
		else if (format === "excel") {
			// Simple Excel format using CSV embedded in HTML (mimics XLS)
			const headers = ["Item Name", "Model", "Stock Level", "Supplier"];
			const rows = filtered.map(item => [
				item.name,
				item.model,
				item.stock,
				item.seller
			]);

			let html = `<table><thead><tr>`;
			headers.forEach(h => html += `<th>${h}</th>`);
			html += `</tr></thead><tbody>`;
			rows.forEach(row => {
				html += `<tr>`;
				row.forEach(cell => html += `<td>${cell}</td>`);
				html += `</tr>`;
			});
			html += `</tbody></table>`;

			res.setHeader("Content-Type", "application/vnd.ms-excel");
			res.setHeader("Content-Disposition", "attachment; filename=inventory_export.xls");
			res.send(html);
		}
		// Prepare PDF data (return JSON for client-side rendering like Ad-export.html)
		else if (format === "pdf") {
			res.status(200).json({
				success: true,
				items: filtered.map(item => ({
					name: item.name,
					model: item.model,
					stock: item.stock,
					seller: item.seller
				})),
				filters: {
					item: itemFilter,
					supplier: supplierFilter,
					search: search
				}
			});
		}

	} catch (err) {
		console.error("❌ Export API Error:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      GET SINGLE INVENTORY ITEM
// ==========================================
// GET /api/inventory/:id
router.get("/:id", async (req, res) => {
	try {
		const item = await Hardware.findById(req.params.id);
		if (!item) return res.status(404).json({ message: "Item not found" });

		const purchasesAgg = await Purchase.aggregate([
			{ $match: { asset_name: item.name, model_name: item.model } },
			{ $group: { _id: null, totalQty: { $sum: "$quantity" } } }
		]);
		const stock = purchasesAgg.length ? purchasesAgg[0].totalQty : 0;

		const lastPurchase = await Purchase.findOne({ asset_name: item.name, model_name: item.model })
			.sort({ arrival_date: -1 })
			.lean();
		const vendor = lastPurchase
			? await Vendor.findOne({ seller_id: lastPurchase.seller_id }).lean()
			: null;

		res.json({
			...item.toObject(),
			stock,
			seller: vendor ? vendor.seller_name : "N/A",
			vendor_id: vendor ? vendor.seller_id : null
		});
	} catch (err) {
		console.error("Error fetching inventory item:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      POST ADD NEW INVENTORY ITEM
// ==========================================
// POST /api/inventory/add
router.post("/add", async (req, res) => {
	try {
		const {
			itemName,
			brand,
			model,
			supplier,
			phone,
			gst,
			seller_id,
			quantity,
			arrival_date
		} = req.body;

		// Validation
		if (!itemName || !model || !supplier || !quantity || !seller_id) {
			return res.status(400).json({
				message: "Missing required fields: itemName, model, supplier, quantity, seller_id"
			});
		}

		// Generate asset_id by fetching last generated asset_id from hardware collection
		let asset_id;

		try {
			// Fetch the last hardware entry to get the last asset_id
			const lastHardware = await Hardware.findOne({})
				.select('asset_id')
				.sort({ _id: -1 })
				.lean();

			if (lastHardware && lastHardware.asset_id) {
				// Extract number from last asset_id (e.g., "AS005" -> 5)
				const match = lastHardware.asset_id.match(/AS(\d+)/);
				if (match) {
					const lastNumber = parseInt(match[1], 10);
					const nextNumber = lastNumber + 1;
					asset_id = `AS${String(nextNumber).padStart(3, '0')}`;
					console.log(`Last asset_id: ${lastHardware.asset_id}, Generated: ${asset_id}`);
				} else {
					// If format doesn't match, start fresh
					asset_id = "AS001";
					console.log("Invalid format in last asset_id, starting with AS001");
				}
			} else {
				// First entry - no hardware in collection yet
				asset_id = "AS001";
				console.log("No hardware found in collection, starting with AS001");
			}
		} catch (error) {
			console.error("Error generating asset_id:", error);
			// Fallback to timestamp-based
			asset_id = `AS-${String(Date.now()).slice(-6)}`;
		}

		// Generate purchase_id by fetching last generated purchase_id from purchases collection
		let purchase_id;

		try {
			// Fetch the last purchase entry to get the last purchase_id
			const lastPurchase = await Purchase.findOne({})
				.select('purchase_id')
				.sort({ _id: -1 })
				.lean();

			if (lastPurchase && lastPurchase.purchase_id) {
				// Extract number from last purchase_id (e.g., "PUR005" -> 5)
				const match = lastPurchase.purchase_id.match(/P(\d+)/);
				if (match) {
					const lastNumber = parseInt(match[1], 10);
					const nextNumber = lastNumber + 1;
					purchase_id = `P${String(nextNumber).padStart(3, '0')}`;
					console.log(`Last purchase_id: ${lastPurchase.purchase_id}, Generated: ${purchase_id}`);
				} else {
					// If format doesn't match, start fresh
					purchase_id = "P001";
					console.log("Invalid format in last purchase_id, starting with P001");
				}
			} else {
				// First entry - no purchases in collection yet
				purchase_id = "P001";
				console.log("No purchases found in collection, starting with P001");
			}
		} catch (error) {
			console.error("Error generating purchase_id:", error);
			// Fallback to timestamp-based
			purchase_id = `P001-${String(Date.now()).slice(-6)}`;
		}

		// 1. Check if vendor exists, create if not
		let vendor = await Vendor.findOne({ seller_id });

		if (!vendor) {
			// Create new vendor
			vendor = new Vendor({
				seller_id,
				seller_name: supplier,
				phone: phone || 0,
				gst_number: gst || "N/A"
			});
			await vendor.save();
			console.log("✅ New vendor created:", supplier);
		}

		// 2. Create hardware entries based on quantity
		const qty = parseInt(quantity);
		const hardwareEntries = [];

		// Extract base number from the starting asset_id
		const match = asset_id.match(/AS(\d+)/);
		if (!match) {
			return res.status(500).json({ message: "Invalid asset_id format" });
		}
		const baseNumber = parseInt(match[1], 10);

		for (let i = 0; i < qty; i++) {
			// Generate sequential asset_id for each item
			const currentAssetId = `AS${String(baseNumber + i).padStart(3, '0')}`;

			const hardware = new Hardware({
				asset_id: currentAssetId,
				name: itemName,
				model: model
			});
			await hardware.save();
			hardwareEntries.push(hardware);
			console.log(`✅ Hardware entry ${i + 1}/${qty} created:`, currentAssetId);
		}

		// 3. Create purchase entry
		const purchase = new Purchase({
			purchase_id,
			asset_name: itemName,
			model_name: model,
			quantity: qty,
			seller_id,
			arrival_date: arrival_date ? new Date(arrival_date) : new Date()
		});
		await purchase.save();
		console.log("✅ Purchase entry created:", purchase_id);

		res.status(201).json({
			message: `${qty} item(s) added successfully`,
			data: {
				totalItems: qty,
				hardwareEntries,
				purchase,
				vendor
			}
		});

	} catch (err) {
		console.error("❌ Error adding new item:", err);

		// Handle duplicate key errors
		if (err.code === 11000) {
			const field = Object.keys(err.keyPattern)[0];
			return res.status(400).json({
				message: `Duplicate ${field}: This ${field} already exists in the database`
			});
		}

		res.status(500).json({
			message: err.message || "Failed to add item"
		});
	}
});
// In routes/inventory.js

// 1. Optimize Hardware List
router.get("/all-hardware", async (req, res) => {
	try {
		// Added .lean() for performance
		const hardware = await Hardware.find().lean();
		res.json(hardware);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// 2. Optimize Vendor List
router.get("/all-vendors", async (req, res) => {
	try {
		const vendors = await Vendor.find().lean(); // <--- Added .lean()
		res.json(vendors);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

module.exports = router;

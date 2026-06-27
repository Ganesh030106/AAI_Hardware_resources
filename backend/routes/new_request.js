// ==========================================
//         NEW INVENTORY ITEM ROUTE
// ==========================================
// Handles adding new items to hardware, purchases, and vendors tables

const express = require("express");
const router = express.Router();

const Hardware = require("../model/hardware");
const Purchase = require("../model/purchases");
const Vendor = require("../model/vendors");

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
			purchase_id,
			seller_id,
			quantity,
			arrival_date
		} = req.body;

		// Validation
		if (!itemName || !model || !supplier || !quantity || !purchase_id || !seller_id) {
			return res.status(400).json({
				message: "Missing required fields: itemName, model, supplier, quantity, purchase_id, seller_id"
			});
		}

		// Generate asset_id by fetching last asset_id and incrementing
		const lastHardware = await Hardware.findOne().sort({ asset_id: -1 }).limit(1);
		let asset_id;
		
		if (lastHardware && lastHardware.asset_id) {
			// Extract number from last asset_id (e.g., "HW-001" -> 1)
			const match = lastHardware.asset_id.match(/HW-(\d+)/);
			if (match) {
				const lastNumber = parseInt(match[1], 10);
				const nextNumber = lastNumber + 1;
				asset_id = `HW-${String(nextNumber).padStart(3, '0')}`;
			} else {
				// If format doesn't match, use timestamp
				asset_id = `HW-${String(Date.now()).slice(-6)}`;
			}
		} else {
			// First entry
			asset_id = "HW-001";
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

		// 2. Create hardware entry
		const hardware = new Hardware({
			asset_id,
			name: itemName,
			model: model
		});
		await hardware.save();
		console.log("✅ Hardware entry created:", asset_id);

		// 3. Create purchase entry
		const purchase = new Purchase({
			purchase_id,
			asset_name: itemName,
			model_name: model,
			quantity: parseInt(quantity),
			seller_id,
			arrival_date: arrival_date ? new Date(arrival_date) : new Date()
		});
		await purchase.save();
		console.log("✅ Purchase entry created:", purchase_id);

		res.status(201).json({
			message: "Item added successfully",
			data: {
				asset_id,
				hardware,
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

module.exports = router;

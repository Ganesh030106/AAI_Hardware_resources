const express = require("express");
const router = express.Router();

// Correct model imports
const Hardware = require("../model/hardware");
const HardwareRequest = require("../model/HardwareRequest");
const Allocation = require("../model/allocation");
const User = require("../model/users");

// APPROVE & ASSIGN REQUEST (allocate specific asset if not already allocated)
router.post("/assign/:request_id", async (req, res) => {
  try {
    const requestId = Number(req.params.request_id);

    const request = await HardwareRequest.findOne({ request_id: requestId });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (!request.asset_id) {
      return res.status(400).json({ message: "Request has no asset_id to assign" });
    }

    const alreadyAllocated = await Allocation.findOne({
      asset_id: request.asset_id,
      status: "allocated"
    });
    if (alreadyAllocated) {
      return res.status(400).json({ message: "Asset already allocated" });
    }

    await Allocation.create({
      asset_id: request.asset_id,
      emp_id: request.emp_id,
      request_id: request.request_id,
      status: "allocated"
    });

    request.status = "allocated";
    await request.save();

    res.json({
      message: "Asset assigned successfully",
      asset_id: request.asset_id
    });
  } catch (err) {
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET HARDWARE NAMES
router.get("/names", async (req, res) => {
  try {
    const names = await Hardware.distinct("name");
    res.json(names);
  } catch (err) {
    console.error("NAMES ERROR:", err);
    res.status(500).json([]);
  }
});

// GET MODELS BY NAME
router.get("/models", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json([]);
    const models = await Hardware.distinct("model", { name });
    res.json(models);
  } catch (err) {
    console.error("MODELS ERROR:", err);
    res.status(500).json([]);
  }
});

// GET AVAILABLE COUNT FOR NAME+MODEL
router.get("/count", async (req, res) => {
  try {
    const { name, model } = req.query;
    if (!name || !model) return res.json({ available: 0 });

    // Step 1: Get total quantity from purchases (sum all quantities for this name+model)
    const Purchase = require("../model/purchases");
    const purchases = await Purchase.find({ asset_name: name, model_name: model });
    const totalQty = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);

    // Step 2: Get all hardware assets for this name+model
    const hardware = await Hardware.find({ name, model }, { asset_id: 1 });
    const assetIds = hardware.map(h => h.asset_id);

    // Step 3: Count how many are allocated
    const allocatedCount = await Allocation.countDocuments({
      asset_id: { $in: assetIds },
      status: "allocated"
    });

    // Step 4: Calculate available = total purchase qty - allocated count
    const available = Math.max(0, totalQty - allocatedCount);
    res.json({ available });
  } catch (err) {
    console.error("COUNT ERROR:", err);
    res.status(500).json({ available: 0 });
  }
});

// CREATE REQUEST AND AUTO-ALLOCATE IF AVAILABLE
router.post("/", async (req, res) => {
  try {
    const { emp_id, name, model, quantity } = req.body;

    if (!emp_id || !name || !model || !quantity) {
      return res.status(400).json({ message: "Missing fields" });
    }
    if (quantity !== 1) {
      return res.status(400).json({ message: "Only 1 asset can be allocated per request" });
    }

    const allAssets = await Hardware.find({ name, model });
    if (allAssets.length === 0) {
      return res.status(404).json({ message: "No such hardware exists" });
    }

    const assignedAssets = await Allocation.find(
      { status: "allocated" },
      { asset_id: 1, _id: 0 }
    );
    const assignedIds = assignedAssets.map(a => a.asset_id);
    const freeAsset = allAssets.find(asset => !assignedIds.includes(asset.asset_id));

    const lastRequest = await HardwareRequest.findOne().sort({ request_id: -1 });
    const nextRequestId = lastRequest ? lastRequest.request_id + 1 : 1;

    if (!freeAsset) {
      await HardwareRequest.create({
        request_id: nextRequestId,
        emp_id,
        asset_id: null,
        quantity,
        status: "rejected",
        order_date: new Date()
      });
      return res.status(400).json({ message: "No assets available. Request rejected." });
    }

    await HardwareRequest.create({
      request_id: nextRequestId,
      emp_id,
      asset_id: freeAsset.asset_id,
      quantity,
      status: "allocated",
      order_date: new Date()
    });

    await Allocation.create({
      asset_id: freeAsset.asset_id,
      emp_id,
      request_id: nextRequestId,
      status: "allocated"
    });

    res.status(201).json({
      message: "Asset allocated successfully",
      request_id: nextRequestId,
      asset_id: freeAsset.asset_id
    });
  } catch (err) {
    console.error("AUTO-ALLOCATION ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Optional helper: fetch user by emp_id (not used by HTML as /api/users is available)
router.get("/:emp_id", async (req, res) => {
  const user = await User.findOne({ emp_id: req.params.emp_id });
  res.json(user || {});
});

module.exports = router;


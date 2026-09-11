const express = require("express");
const authRoutes = require("../features/auth/auth.routes");
const goldRatesRoutes = require("../features/gold-rates/gold-rates.routes");
const categoriesRoutes = require("../features/categories/categories.routes");
const jewelleryRoutes = require("../features/jewellery/jewellery.routes");
const uploadsRoutes = require("../features/uploads/uploads.routes");
const jewelleryService = require("../features/jewellery/jewellery.service");
const dataStore = require("../database/dataStore");

const router = express.Router();

// Health Check
router.get("/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        service: "Krishna Jewellers API"
    });
});

// Full Data Dump (read-only)
router.get("/data", (req, res) => {
    res.json({
        success: true,
        data: dataStore.getData()
    });
});

// Search alias
router.get("/search", (req, res, next) => {
    try {
        const { q, category } = req.query;
        const result = jewelleryService.getJewellery({ search: q, category });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Feature routers
router.use("/auth", authRoutes);
router.use("/admin", authRoutes); // Backwards compatibility for /api/admin/login etc.
router.use("/gold-rates", goldRatesRoutes);
router.use("/rates", goldRatesRoutes); // Alias
router.use("/categories", categoriesRoutes);
router.use("/jewellery", jewelleryRoutes);
router.use("/", uploadsRoutes); // /api/upload-image

module.exports = router;

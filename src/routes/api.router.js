const express = require("express");
const authRoutes = require("../features/auth/auth.routes");
const goldRatesRoutes = require("../features/gold-rates/gold-rates.routes");
const categoriesRoutes = require("../features/categories/categories.routes");
const jewelleryRoutes = require("../features/jewellery/jewellery.routes");
const uploadsRoutes = require("../features/uploads/uploads.routes");
const imagesRoutes = require("../features/uploads/images.routes");
const jewelleryService = require("../features/jewellery/jewellery.service");

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

// Search alias
router.get("/search", async (req, res, next) => {
    try {
        const { q, category } = req.query;
        const result = await jewelleryService.getJewellery({ search: q, category });
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
router.use("/images", imagesRoutes);
router.use("/", uploadsRoutes); // /api/upload-image

module.exports = router;

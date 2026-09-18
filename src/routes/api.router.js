const express = require("express");
const authRoutes = require("../features/auth/auth.routes");
const goldRatesRoutes = require("../features/gold-rates/gold-rates.routes");
const categoriesRoutes = require("../features/categories/categories.routes");
const jewelleryRoutes = require("../features/jewellery/jewellery.routes");
const uploadsRoutes = require("../features/uploads/uploads.routes");
const jewelleryService = require("../features/jewellery/jewellery.service");

const router = express.Router();

router.get("/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        service: "Krishna Jewellers API"
    });
});

router.get("/search", async (req, res, next) => {
    try {
        const { q, category } = req.query;
        const result = await jewelleryService.getJewellery({ search: q, category });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

router.use("/auth", authRoutes);
router.use("/admin", authRoutes);
router.use("/gold-rates", goldRatesRoutes);
router.use("/rates", goldRatesRoutes);
router.use("/categories", categoriesRoutes);
router.use("/jewellery", jewelleryRoutes);
router.use("/", uploadsRoutes); // POST /api/cloudinary-sign

module.exports = router;

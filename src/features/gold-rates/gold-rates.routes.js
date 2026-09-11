const express = require("express");
const goldRatesController = require("./gold-rates.controller");

const router = express.Router();

// GET /api/gold-rates — Live from Pankaj Chain feed (no auth needed)
router.get("/", (req, res, next) => goldRatesController.getRates(req, res, next));

// POST /api/gold-rates — Removed: gold rates are now auto-fetched from live feed

module.exports = router;

const express = require("express");
const goldRatesController = require("./gold-rates.controller");
const { requireAdmin } = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/", (req, res, next) => goldRatesController.getRates(req, res, next));
router.post("/", requireAdmin, (req, res, next) => goldRatesController.updateRates(req, res, next));

module.exports = router;

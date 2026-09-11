const express = require("express");
const jewelleryController = require("./jewellery.controller");
const { requireAdmin } = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/", (req, res, next) => jewelleryController.getAll(req, res, next));
router.get("/:id", (req, res, next) => jewelleryController.getById(req, res, next));
router.post("/", requireAdmin, (req, res, next) => jewelleryController.create(req, res, next));
router.put("/:id", requireAdmin, (req, res, next) => jewelleryController.update(req, res, next));
router.delete("/:id", requireAdmin, (req, res, next) => jewelleryController.delete(req, res, next));

module.exports = router;

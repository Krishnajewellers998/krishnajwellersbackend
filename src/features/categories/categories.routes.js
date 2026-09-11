const express = require("express");
const categoriesController = require("./categories.controller");
const { requireAdmin } = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/", (req, res, next) => categoriesController.getAll(req, res, next));
router.post("/", requireAdmin, (req, res, next) => categoriesController.create(req, res, next));
router.put("/:name", requireAdmin, (req, res, next) => categoriesController.update(req, res, next));
router.delete("/:name", requireAdmin, (req, res, next) => categoriesController.delete(req, res, next));

module.exports = router;

const express = require("express");
const upload = require("../../middleware/upload.middleware");
const uploadsController = require("./uploads.controller");
const { requireAdmin } = require("../../middleware/auth.middleware");

const router = express.Router();

router.post("/upload-image", requireAdmin, upload.single("image"), (req, res, next) => {
    uploadsController.uploadSingle(req, res, next);
});

module.exports = router;

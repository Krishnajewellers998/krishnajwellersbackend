const express = require("express");
const cloudinaryController = require("./cloudinary.controller");
const { requireAdmin } = require("../../middleware/auth.middleware");

const router = express.Router();

// Signed upload params for direct client → Cloudinary uploads
router.post("/cloudinary-sign", requireAdmin, (req, res, next) => {
    cloudinaryController.getUploadSignature(req, res, next);
});

module.exports = router;

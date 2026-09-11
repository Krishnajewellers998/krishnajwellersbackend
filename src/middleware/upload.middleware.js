const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("../config/env");

// Ensure images directory exists
if (!fs.existsSync(config.IMAGES_DIR)) {
    fs.mkdirSync(config.IMAGES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
        const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e5);
        cb(null, `${cleanName}_${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG, and WebP images up to 10MB are allowed."), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter
});

module.exports = upload;

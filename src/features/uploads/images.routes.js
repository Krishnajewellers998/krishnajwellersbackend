const express = require("express");
const { getPool } = require("../../database/dataStore");

const router = express.Router();

router.get("/:id", async (req, res, next) => {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.query(
            `SELECT mime_type, base64_data FROM images WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Image not found." });
        }

        const { mime_type, base64_data } = result.rows[0];
        
        const imgBuffer = Buffer.from(base64_data, "base64");
        
        res.setHeader("Content-Type", mime_type);
        res.setHeader("Content-Length", imgBuffer.length);
        // Cache images for 30 days since they are immutable
        res.setHeader("Cache-Control", "public, max-age=2592000");
        
        res.end(imgBuffer);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

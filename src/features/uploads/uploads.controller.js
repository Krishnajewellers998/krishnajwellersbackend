const { getPool } = require("../../database/dataStore");
const crypto = require("crypto");

class UploadsController {
    async uploadSingle(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No image file provided or file format is invalid."
                });
            }

            const pool = getPool();
            const b64 = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype;
            
            const uuid = crypto.randomUUID();

            await pool.query(
                `INSERT INTO images (id, mime_type, base64_data) VALUES ($1, $2, $3)`,
                [uuid, mimeType, b64]
            );

            const imageUrl = `/api/images/${uuid}`;

            res.status(201).json({
                success: true,
                message: "Image uploaded successfully.",
                image: imageUrl,
                url: imageUrl
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UploadsController();

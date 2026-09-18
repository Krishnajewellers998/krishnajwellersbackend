const cloudinary = require("cloudinary").v2;
const config = require("../../config/env");

/**
 * Frontend / app must upload images DIRECTLY to Cloudinary using the signature
 * returned by POST /api/cloudinary-sign, then send only the resulting secure_url
 * string to create/update jewellery & category endpoints. The backend never
 * receives raw image bytes.
 */
class CloudinaryController {
    getUploadSignature(req, res, next) {
        try {
            const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = config;

            if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
                return res.status(503).json({
                    success: false,
                    message: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
                });
            }

            cloudinary.config({
                cloud_name: CLOUDINARY_CLOUD_NAME,
                api_key: CLOUDINARY_API_KEY,
                api_secret: CLOUDINARY_API_SECRET,
                secure: true
            });

            const timestamp = Math.round(Date.now() / 1000);
            const folder = "krishna-jewellers";

            const signature = cloudinary.utils.api_sign_request(
                { timestamp, folder },
                CLOUDINARY_API_SECRET
            );

            res.json({
                success: true,
                timestamp,
                signature,
                apiKey: CLOUDINARY_API_KEY,
                cloudName: CLOUDINARY_CLOUD_NAME,
                folder
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new CloudinaryController();

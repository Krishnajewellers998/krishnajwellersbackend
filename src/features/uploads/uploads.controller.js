class UploadsController {
    uploadSingle(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No image file provided or file format is invalid."
                });
            }

            const b64 = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype;
            const dataUri = `data:${mimeType};base64,${b64}`;

            res.status(201).json({
                success: true,
                message: "Image uploaded successfully.",
                image: dataUri,
                url: dataUri
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UploadsController();

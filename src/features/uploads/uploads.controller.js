class UploadsController {
    uploadSingle(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No image file provided or file format is invalid."
                });
            }

            const imagePath = `images/${req.file.filename}`;
            res.status(201).json({
                success: true,
                message: "Image uploaded successfully.",
                image: imagePath,
                url: `/${imagePath}`
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UploadsController();

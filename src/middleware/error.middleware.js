function errorHandler(err, req, res, next) {
    console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);

    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
}

function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
}

module.exports = {
    errorHandler,
    notFoundHandler
};

const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config/env");
const apiRouter = require("./routes/api.router");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");

const app = express();

// CORS Configuration - Supports Website, Admin, Mobile, and local dev
app.use(cors({
    origin: (origin, callback) => {
        // Allow mobile apps, curl, server-to-server (no origin)
        if (!origin) return callback(null, true);
        // Allow localhost origins (3000, 3001, 5173, etc.) and production domains
        callback(null, true);
    },
    credentials: true
}));

// Body Parsers
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Static Media Hosting: /images/*
app.use("/images", express.static(config.IMAGES_DIR, {
    maxAge: "7d",
    etag: true
}));

// Mount Central API
app.use("/api", apiRouter);

// 404 handler for API routes
app.use("/api/*", notFoundHandler);

// Central Error Handler
app.use(errorHandler);

module.exports = app;

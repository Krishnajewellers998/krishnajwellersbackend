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
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Static Media Hosting Removed: Images are now stored as Base64 in PostgreSQL

// Mount Central API
app.use("/api", apiRouter);

// 404 handler for unmatched API routes ONLY
app.use("/api/*", notFoundHandler);

// Central Error Handler
app.use(errorHandler);

// If website dist build exists, serve it and route all SPA page requests (e.g. /admin, /privacy-policy)
const fs = require("fs");
if (fs.existsSync(config.WEB_DIST_DIR)) {
    app.use(express.static(config.WEB_DIST_DIR));
    app.get("*", (req, res) => {
        const indexPath = path.join(config.WEB_DIST_DIR, "index.html");
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send("Frontend build index.html not found");
        }
    });
}

module.exports = app;

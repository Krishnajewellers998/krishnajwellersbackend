const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes/api.router");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");

const app = express();

// CORS — allow website, admin, mobile, and local dev
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        callback(null, true);
    },
    credentials: true
}));

// JSON only — images upload directly to Cloudinary from the client
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/api", apiRouter);

app.use("/api/*", notFoundHandler);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

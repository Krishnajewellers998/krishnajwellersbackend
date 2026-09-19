const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes/api.router");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");

const app = express();

const BODYLESS_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// CORS first — must run before auth/body parsers so OPTIONS preflight never
// waits on JWT or JSON body reading.
app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser / same-origin tools (no Origin header) and all browser origins.
        if (!origin) return callback(null, true);
        callback(null, true);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Token"],
    optionsSuccessStatus: 204,
    preflightContinue: false // cors ends OPTIONS itself; do not fall through into auth/body parsers
}));

// Only parse bodies for methods that can carry one.
// Critical: the website always sends Content-Type: application/json on GET as well.
// express.json() then tries to read a body; on some serverless adapters that stream
// never ends → indefinite hang with zero outgoing requests.
app.use((req, res, next) => {
    if (BODYLESS_METHODS.has(req.method)) return next();
    return express.json({ limit: "2mb" })(req, res, next);
});

app.use((req, res, next) => {
    if (BODYLESS_METHODS.has(req.method)) return next();
    return express.urlencoded({ extended: true, limit: "2mb" })(req, res, next);
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

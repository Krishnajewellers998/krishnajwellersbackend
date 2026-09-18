const path = require("path");
const fs = require("fs");

// Load local .env if present (local dev only; Vercel injects env vars directly)
(function loadLocalEnv() {
    try {
        const envPath = path.resolve(__dirname, "../../.env");
        if (fs.existsSync(envPath)) {
            const text = fs.readFileSync(envPath, "utf8");
            text.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#")) return;
                const i = trimmed.indexOf("=");
                if (i < 1) return;
                const key = trimmed.slice(0, i).trim();
                let value = trimmed.slice(i + 1).trim();
                if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                if (process.env[key] === undefined) process.env[key] = value;
            });
        }
    } catch (_) {}
})();

module.exports = {
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: process.env.NODE_ENV || "development",
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || "krishnaadmin",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    DATABASE_URL: process.env.DATABASE_URL || "",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || ""
};

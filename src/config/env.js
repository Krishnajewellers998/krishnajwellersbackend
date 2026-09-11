const path = require("path");
const fs = require("fs");

// Load local .env if present
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
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "KJ!Admin#2026-Gold",
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || "kj_secret_key_2026_super_secure",
    DATABASE_URL: process.env.DATABASE_URL || "",
    DATA_FILE: path.resolve(__dirname, "../../data.json"),
    IMAGES_DIR: path.resolve(__dirname, "../../images"),
    PANKAJ_LIVE_URL: "https://bcast.pankajchain.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/pankajchain"
};

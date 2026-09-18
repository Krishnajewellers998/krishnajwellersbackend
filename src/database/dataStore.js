const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
const config = require("../config/env");

// Neon WebSocket driver — required for Pool in Node.js / Vercel serverless
neonConfig.webSocketConstructor = ws;

let pool = null;

function getPool() {
    if (!config.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set. Configure a Neon connection string.");
    }

    if (!pool) {
        // Low max connections — each serverless invocation should stay light
        pool = new Pool({
            connectionString: config.DATABASE_URL,
            max: 1
        });
    }

    return pool;
}

module.exports = {
    getPool
};

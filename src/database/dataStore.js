const fs = require("fs");
const { Pool } = require("pg");
const config = require("../config/env");

let pool = null;
if (config.DATABASE_URL) {
    pool = new Pool({
        connectionString: config.DATABASE_URL,
        ssl: config.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
    });
}

const defaultData = {
    goldRates: { "24K": 158000, "22K": 145305, "18K": 118886 },
    updatedAt: new Date().toISOString(),
    categories: [],
    jewellery: []
};

let runtimeData = null;
let saveQueue = Promise.resolve();

async function initDatabase() {
    if (pool) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS krishna_jewellers_data (
                    id INTEGER PRIMARY KEY,
                    data JSONB NOT NULL
                )
            `);
            const res = await pool.query(`SELECT data FROM krishna_jewellers_data WHERE id = 1`);
            if (res.rows.length > 0) {
                runtimeData = { ...defaultData, ...res.rows[0].data };
                console.log("[DataStore] Loaded data from PostgreSQL.");
                return;
            }
        } catch (err) {
            console.warn("[DataStore] PostgreSQL init failed, falling back to local file:", err.message);
        }
    }

    // Load from local data.json
    try {
        if (fs.existsSync(config.DATA_FILE)) {
            const raw = fs.readFileSync(config.DATA_FILE, "utf8");
            runtimeData = { ...defaultData, ...JSON.parse(raw) };
            console.log("[DataStore] Loaded data from data.json.");
        } else {
            runtimeData = { ...defaultData };
            fs.writeFileSync(config.DATA_FILE, JSON.stringify(runtimeData, null, 2), "utf8");
            console.log("[DataStore] Initialized new data.json.");
        }
    } catch (err) {
        console.error("[DataStore] Error reading data.json:", err.message);
        runtimeData = { ...defaultData };
    }

    // Seed into DB if pool exists
    if (pool) {
        try {
            await pool.query(
                `INSERT INTO krishna_jewellers_data (id, data) VALUES ($1, $2::jsonb)
                 ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
                [1, JSON.stringify(runtimeData)]
            );
        } catch (_) {}
    }
}

function getData() {
    if (!runtimeData) {
        return { ...defaultData };
    }
    return runtimeData;
}

function updateData(mutator) {
    if (!runtimeData) runtimeData = { ...defaultData };
    runtimeData = mutator(runtimeData);
    runtimeData.updatedAt = new Date().toISOString();

    saveQueue = saveQueue.then(async () => {
        try {
            // Write to local file backup
            fs.writeFileSync(config.DATA_FILE, JSON.stringify(runtimeData, null, 2), "utf8");

            // Write to Postgres if connected
            if (pool) {
                await pool.query(
                    `INSERT INTO krishna_jewellers_data (id, data) VALUES ($1, $2::jsonb)
                     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
                    [1, JSON.stringify(runtimeData)]
                );
            }
        } catch (err) {
            console.error("[DataStore] Persist error:", err.message);
        }
    });

    return runtimeData;
}

module.exports = {
    initDatabase,
    getData,
    updateData
};

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
                console.log("[DataStore] Connected directly to PostgreSQL database. Loaded live data.");
                return;
            } else {
                runtimeData = { ...defaultData };
                await pool.query(
                    `INSERT INTO krishna_jewellers_data (id, data) VALUES ($1, $2::jsonb)`,
                    [1, JSON.stringify(runtimeData)]
                );
                console.log("[DataStore] Initialized PostgreSQL record id=1.");
                return;
            }
        } catch (err) {
            console.error("[DataStore] PostgreSQL database connection failed:", err.message);
        }
    }

    // Fallback in case PostgreSQL is not provided or connection fails
    runtimeData = { ...defaultData };
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
            // Write directly to PostgreSQL database
            if (pool) {
                await pool.query(
                    `INSERT INTO krishna_jewellers_data (id, data) VALUES ($1, $2::jsonb)
                     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
                    [1, JSON.stringify(runtimeData)]
                );
            }
        } catch (err) {
            console.error("[DataStore] PostgreSQL database save error:", err.message);
        }
    });

    return runtimeData;
}

module.exports = {
    initDatabase,
    getData,
    updateData
};

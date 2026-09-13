const { Pool } = require("pg");
const config = require("../config/env");

let pool = null;
if (config.DATABASE_URL) {
    pool = new Pool({
        connectionString: config.DATABASE_URL,
        ssl: config.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
    });
}

const defaultGoldRates = { "24K": 158000, "22K": 145305, "18K": 118886 };

async function initDatabase() {
    if (!pool) {
        console.warn("[DataStore] PostgreSQL database URL not provided. Running in limited mode.");
        return;
    }

    try {
        // Create new relational tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS gold_rates (
                id INTEGER PRIMARY KEY,
                data JSONB NOT NULL
            );

            CREATE TABLE IF NOT EXISTS categories (
                name TEXT PRIMARY KEY,
                image TEXT,
                synonyms JSONB DEFAULT '[]'::jsonb
            );

            CREATE TABLE IF NOT EXISTS jewellery (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT REFERENCES categories(name) ON UPDATE CASCADE ON DELETE SET NULL,
                description TEXT,
                image TEXT,
                photos JSONB DEFAULT '[]'::jsonb,
                weight TEXT,
                purity TEXT DEFAULT '22K',
                price NUMERIC DEFAULT 0,
                synonyms JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS images (
                id TEXT PRIMARY KEY,
                mime_type TEXT,
                base64_data TEXT
            );
        `);

        // Check if old JSON table exists for migration
        const oldTableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'krishna_jewellers_data'
            );
        `);

        if (oldTableCheck.rows[0].exists) {
            console.log("[DataStore] Old JSON table found. Starting data migration...");
            const oldDataRes = await pool.query(`SELECT data FROM krishna_jewellers_data WHERE id = 1`);
            
            if (oldDataRes.rows.length > 0) {
                const oldData = oldDataRes.rows[0].data;

                // 1. Migrate Gold Rates
                if (oldData.goldRates) {
                    await pool.query(
                        `INSERT INTO gold_rates (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING`,
                        [JSON.stringify(oldData.goldRates)]
                    );
                }

                // 2. Migrate Categories
                if (Array.isArray(oldData.categories)) {
                    for (const cat of oldData.categories) {
                        const name = typeof cat === "string" ? cat : cat.name;
                        const image = typeof cat === "object" ? cat.image : "";
                        const synonyms = typeof cat === "object" && Array.isArray(cat.synonyms) ? cat.synonyms : [];
                        
                        await pool.query(
                            `INSERT INTO categories (name, image, synonyms) VALUES ($1, $2, $3::jsonb)
                             ON CONFLICT (name) DO NOTHING`,
                            [name, image, JSON.stringify(synonyms)]
                        );
                    }
                }

                // 3. Migrate Jewellery
                if (Array.isArray(oldData.jewellery)) {
                    for (const item of oldData.jewellery) {
                        await pool.query(
                            `INSERT INTO jewellery (id, name, category, description, image, photos, weight, purity, price, synonyms, created_at)
                             VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11)
                             ON CONFLICT (id) DO NOTHING`,
                            [
                                item.id,
                                item.name || "Unnamed",
                                item.category || null,
                                item.description || "",
                                item.image || "",
                                JSON.stringify(item.photos || []),
                                item.weight || "",
                                item.purity || "22K",
                                Number(item.price) || 0,
                                JSON.stringify(item.synonyms || []),
                                item.createdAt || new Date().toISOString()
                            ]
                        );
                        // Update sequence to handle future inserts safely
                        await pool.query(`SELECT setval('jewellery_id_seq', (SELECT MAX(id) FROM jewellery))`);
                    }
                }

                // Drop the old table after successful migration
                await pool.query(`DROP TABLE krishna_jewellers_data`);
                console.log("[DataStore] Data migration complete and old table dropped.");
            }
        }

        // Ensure gold rates exist
        const goldRatesCheck = await pool.query(`SELECT 1 FROM gold_rates WHERE id = 1`);
        if (goldRatesCheck.rows.length === 0) {
            await pool.query(
                `INSERT INTO gold_rates (id, data) VALUES (1, $1::jsonb)`,
                [JSON.stringify(defaultGoldRates)]
            );
        }

        console.log("[DataStore] Database initialization complete.");
    } catch (err) {
        console.error("[DataStore] PostgreSQL database initialization failed:", err.message);
    }
}

function getPool() {
    if (!pool) {
        throw new Error("Database pool is not initialized. Ensure DATABASE_URL is set.");
    }
    return pool;
}

module.exports = {
    initDatabase,
    getPool
};

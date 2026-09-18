/**
 * One-time / manual schema migration for Neon PostgreSQL.
 * Run: node scripts/migrate.js
 *
 * Does NOT run on app boot or per-request — keep it out of the serverless path.
 */
const path = require("path");
const fs = require("fs");

// Load .env from project root before anything else
(function loadEnv() {
    const envPath = path.resolve(__dirname, "../.env");
    if (!fs.existsSync(envPath)) return;
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
})();

const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");

neonConfig.webSocketConstructor = ws;

const defaultGoldRates = { "24K": 158000, "22K": 145305, "18K": 118886 };

async function migrate() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("FATAL: DATABASE_URL is required. Set it in .env or the environment.");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: databaseUrl, max: 1 });

    try {
        console.log("[migrate] Creating tables...");

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
        `);

        // image / photos columns store Cloudinary URL strings (not base64).
        // Drop legacy base64 images table if it still exists from the old architecture.
        await pool.query(`DROP TABLE IF EXISTS images`);

        // Optional one-time migration from the old monolithic JSON table
        const oldTableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'krishna_jewellers_data'
            );
        `);

        if (oldTableCheck.rows[0].exists) {
            console.log("[migrate] Old JSON table found. Migrating data...");
            const oldDataRes = await pool.query(`SELECT data FROM krishna_jewellers_data WHERE id = 1`);

            if (oldDataRes.rows.length > 0) {
                const oldData = oldDataRes.rows[0].data;

                if (oldData.goldRates) {
                    await pool.query(
                        `INSERT INTO gold_rates (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING`,
                        [JSON.stringify(oldData.goldRates)]
                    );
                }

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
                    }
                    await pool.query(`SELECT setval('jewellery_id_seq', COALESCE((SELECT MAX(id) FROM jewellery), 1))`);
                }

                await pool.query(`DROP TABLE krishna_jewellers_data`);
                console.log("[migrate] Legacy data migration complete.");
            }
        }

        const goldRatesCheck = await pool.query(`SELECT 1 FROM gold_rates WHERE id = 1`);
        if (goldRatesCheck.rows.length === 0) {
            await pool.query(
                `INSERT INTO gold_rates (id, data) VALUES (1, $1::jsonb)`,
                [JSON.stringify(defaultGoldRates)]
            );
            console.log("[migrate] Seeded default gold rates.");
        }

        console.log("[migrate] Done.");
    } catch (err) {
        console.error("[migrate] Failed:", err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

migrate();

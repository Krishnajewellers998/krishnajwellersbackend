const { neon } = require("@neondatabase/serverless");
const config = require("../config/env");

/**
 * Neon HTTP driver (not WebSocket Pool).
 *
 * Why HTTP on Vercel:
 * - WebSocket Pool reused across invocations is a known hang risk when the
 *   isolate freezes/resumes with a dead socket.
 * - Vercel "outgoing requests" logging tracks HTTP fetch; WebSocket DB traffic
 *   often shows as "No outgoing requests" while the query hangs forever.
 * - HTTP queries get an explicit fetch AbortSignal timeout so they fail fast
 *   instead of waiting until FUNCTION_INVOCATION_TIMEOUT (300s).
 */

const QUERY_TIMEOUT_MS = 10_000;

let sql = null;

function getSql() {
    if (!config.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set. Configure a Neon connection string.");
    }

    if (!sql) {
        // fullResults → { rows, rowCount, ... } matching node-postgres / Pool.query shape
        sql = neon(config.DATABASE_URL, { fullResults: true });
    }

    return sql;
}

/**
 * Drop-in replacement for the old `getPool()` so existing `pool.query(text, params)`
 * call sites keep working, backed by Neon HTTP instead of a WebSocket Pool.
 */
function getPool() {
    const client = getSql();
    return {
        query(text, params = []) {
            return client.query(text, params, {
                fetchOptions: {
                    signal: AbortSignal.timeout(QUERY_TIMEOUT_MS)
                }
            });
        }
    };
}

module.exports = {
    getPool,
    getSql
};

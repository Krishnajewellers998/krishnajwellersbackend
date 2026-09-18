/**
 * Local development entrypoint.
 * Production on Vercel uses /api/index.js (serverless-http) — no app.listen there.
 */
const app = require("./app");
const config = require("./config/env");

app.listen(config.PORT, () => {
    console.log("==================================================");
    console.log("  Krishna Jewellers Backend API (local)");
    console.log(`  Listening: http://localhost:${config.PORT}`);
    console.log(`  Health:    http://localhost:${config.PORT}/api/health`);
    console.log("==================================================");
});

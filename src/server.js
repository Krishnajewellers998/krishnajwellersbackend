const app = require("./app");
const config = require("./config/env");
const { initDatabase } = require("./database/dataStore");

async function startServer() {
    try {
        console.log("==================================================");
        console.log("  Initializing Krishna Jewellers Backend API...");
        await initDatabase();

        app.listen(config.PORT, () => {
            console.log(`  Backend API Server listening on: http://localhost:${config.PORT}`);
            console.log(`  Health Check: http://localhost:${config.PORT}/api/health`);
            // Static media path log removed
            console.log("==================================================");
        });
    } catch (err) {
        console.error("FATAL: Failed to start backend server:", err);
        process.exit(1);
    }
}

startServer();

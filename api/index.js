/**
 * Vercel serverless entry.
 * Export the Express app directly — Vercel's native Express support (Fluid compute).
 * Avoid serverless-http here: its stub request streams have interacted badly with
 * body parsers (hangs waiting for a body that never arrives on GET/OPTIONS).
 */
module.exports = require("../src/app");

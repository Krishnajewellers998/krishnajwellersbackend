const crypto = require("crypto");
const config = require("../config/env");

const adminSessions = new Map();
const SESSION_COOKIE = "kj_admin_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function safeEqual(a, b) {
    const aa = Buffer.from(String(a || ""));
    const bb = Buffer.from(String(b || ""));
    return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function parseCookies(req) {
    const raw = req.headers.cookie || "";
    const out = {};
    raw.split(";").forEach(part => {
        const index = part.indexOf("=");
        if (index < 0) return;
        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        out[key] = decodeURIComponent(value);
    });
    return out;
}

function isSessionValid(token) {
    if (!token) return false;
    const session = adminSessions.get(token);
    if (!session) return false;
    if (session.expiresAt < Date.now()) {
        adminSessions.delete(token);
        return false;
    }
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    return true;
}

function createSession() {
    const token = crypto.randomBytes(32).toString("hex");
    adminSessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_TTL_MS
    });
    return token;
}

function destroySession(token) {
    if (token) adminSessions.delete(token);
}

function setAdminCookie(res, token) {
    const secure = config.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_MS / 1000}; Path=/; HttpOnly; SameSite=Lax${secure}`
    );
}

function clearAdminCookie(res) {
    res.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
    );
}

function requireAdmin(req, res, next) {
    const token = parseCookies(req)[SESSION_COOKIE] || req.headers["x-admin-token"] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

    if (isSessionValid(token)) {
        return next();
    }

    return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
        loginRequired: true
    });
}

module.exports = {
    safeEqual,
    parseCookies,
    isSessionValid,
    createSession,
    destroySession,
    setAdminCookie,
    clearAdminCookie,
    requireAdmin,
    SESSION_COOKIE
};

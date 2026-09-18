const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config/env");

function safeEqual(a, b) {
    const aa = Buffer.from(String(a || ""));
    const bb = Buffer.from(String(b || ""));
    return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function extractBearerToken(req) {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
        return header.slice(7).trim();
    }
    // Legacy fallbacks during client migration
    return req.headers["x-admin-token"] || null;
}

function signAdminToken(payload = {}) {
    if (!config.JWT_SECRET) {
        throw { status: 503, message: "JWT_SECRET is not configured on the server." };
    }
    return jwt.sign(
        {
            role: "admin",
            id: payload.id || "admin",
            ...payload
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
    );
}

function verifyAdminToken(token) {
    if (!token || !config.JWT_SECRET) return null;
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        if (decoded.role !== "admin") return null;
        return decoded;
    } catch (_) {
        return null;
    }
}

function requireAdmin(req, res, next) {
    const token = extractBearerToken(req);
    const decoded = verifyAdminToken(token);

    if (decoded) {
        req.admin = decoded;
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
    extractBearerToken,
    signAdminToken,
    verifyAdminToken,
    requireAdmin
};

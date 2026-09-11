const config = require("../../config/env");
const { safeEqual, createSession, destroySession } = require("../../middleware/auth.middleware");

class AuthService {
    login(username, password) {
        if (!config.ADMIN_PASSWORD) {
            throw { status: 503, message: "Admin authentication is not configured on the server." };
        }

        const isUserMatch = safeEqual(String(username || "").trim(), config.ADMIN_USERNAME);
        const isPassMatch = safeEqual(String(password || ""), config.ADMIN_PASSWORD);

        if (!isUserMatch || !isPassMatch) {
            throw { status: 401, message: "Invalid Admin ID or Password." };
        }

        const token = createSession();
        return token;
    }

    logout(token) {
        destroySession(token);
    }
}

module.exports = new AuthService();

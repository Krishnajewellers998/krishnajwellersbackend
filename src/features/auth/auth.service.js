const config = require("../../config/env");
const { safeEqual, signAdminToken } = require("../../middleware/auth.middleware");

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

        return signAdminToken({ id: config.ADMIN_USERNAME, role: "admin" });
    }

    // JWT is stateless — logout is handled client-side by discarding the token.
    logout() {
        return true;
    }
}

module.exports = new AuthService();

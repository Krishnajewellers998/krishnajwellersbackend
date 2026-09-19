const config = require("../../config/env");
const { safeEqual, signAdminToken } = require("../../middleware/auth.middleware");

class AuthService {
    login(username, password) {
        if (!config.ADMIN_PASSWORD) {
            throw { status: 503, message: "Admin authentication is not configured on the server." };
        }

        const submittedUser = String(username || "").trim();
        const submittedPass = String(password || "");

        // TEMP debug — lengths only, never values. Remove after login diagnosis.
        console.log("[auth-debug] login attempt lengths", {
            envUsernameLen: process.env.ADMIN_USERNAME == null ? null : String(process.env.ADMIN_USERNAME).length,
            envPasswordLen: process.env.ADMIN_PASSWORD == null ? null : String(process.env.ADMIN_PASSWORD).length,
            configUsernameLen: String(config.ADMIN_USERNAME || "").length,
            configPasswordLen: String(config.ADMIN_PASSWORD || "").length,
            submittedUsernameLen: submittedUser.length,
            submittedPasswordLen: submittedPass.length
        });

        const isUserMatch = safeEqual(submittedUser, config.ADMIN_USERNAME);
        const isPassMatch = safeEqual(submittedPass, config.ADMIN_PASSWORD);

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

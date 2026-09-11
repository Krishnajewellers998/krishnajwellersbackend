const authService = require("./auth.service");
const { setAdminCookie, clearAdminCookie, parseCookies, SESSION_COOKIE, isSessionValid } = require("../../middleware/auth.middleware");

class AuthController {
    login(req, res, next) {
        try {
            const { username, password } = req.body;
            const token = authService.login(username, password);
            setAdminCookie(res, token);
            res.json({
                success: true,
                message: "Admin login successful.",
                token
            });
        } catch (err) {
            next(err);
        }
    }

    logout(req, res, next) {
        try {
            const token = parseCookies(req)[SESSION_COOKIE] || req.headers["x-admin-token"];
            if (token) authService.logout(token);
            clearAdminCookie(res);
            res.json({
                success: true,
                message: "Logged out successfully."
            });
        } catch (err) {
            next(err);
        }
    }

    checkAuth(req, res) {
        const token = parseCookies(req)[SESSION_COOKIE] || req.headers["x-admin-token"] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
        const authenticated = isSessionValid(token);
        res.json({
            success: true,
            authenticated
        });
    }
}

module.exports = new AuthController();

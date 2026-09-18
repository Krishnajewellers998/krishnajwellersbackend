const authService = require("./auth.service");
const { extractBearerToken, verifyAdminToken } = require("../../middleware/auth.middleware");

class AuthController {
    login(req, res, next) {
        try {
            const { username, password } = req.body;
            const token = authService.login(username, password);
            res.json({
                success: true,
                message: "Admin login successful.",
                token,
                // Client must send: Authorization: Bearer <token>
                expiresIn: "7d"
            });
        } catch (err) {
            next(err);
        }
    }

    logout(req, res, next) {
        try {
            authService.logout();
            res.json({
                success: true,
                message: "Logged out successfully. Discard the JWT on the client."
            });
        } catch (err) {
            next(err);
        }
    }

    checkAuth(req, res) {
        const token = extractBearerToken(req);
        const decoded = verifyAdminToken(token);
        res.json({
            success: true,
            authenticated: Boolean(decoded),
            admin: decoded ? { id: decoded.id, role: decoded.role } : null
        });
    }
}

module.exports = new AuthController();

const express = require("express");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/login", (req, res, next) => authController.login(req, res, next));
router.post("/logout", (req, res, next) => authController.logout(req, res, next));
router.get("/me", (req, res) => authController.checkAuth(req, res));

module.exports = router;

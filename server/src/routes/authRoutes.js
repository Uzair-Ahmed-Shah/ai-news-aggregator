const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController.js")
const { authenticateToken } = require('../middleware/checkAuth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

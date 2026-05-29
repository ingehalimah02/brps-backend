const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser } = require('../middleware/auth');

// Apply authentication middleware to all routes below
router.use(authenticateUser);

// GET /api/users/profile - Get current user profile
router.get('/profile', userController.getProfile);

// PUT /api/users/profile - Edit / update user profile data
router.put('/profile', userController.updateProfile);

module.exports = router;

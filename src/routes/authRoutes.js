const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authenticateUser } = require('../middleware/auth');

// POST /api/auth/signup - User registration & profile initialization
router.post('/signup', authController.signUp);

// POST /api/auth/signin - Authenticate user & get session token
router.post('/signin', authController.signIn);

// POST /api/auth/logout - Sign out user and invalidate sessions
router.post('/logout', authenticateUser, authController.signOut);

// PUT /api/auth/update-password - Update user password (requires authentication)
router.put('/update-password', authenticateUser, authController.updatePassword);

module.exports = router;

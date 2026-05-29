const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/signup - User registration & profile initialization
router.post('/signup', authController.signUp);

// POST /api/auth/signin - Authenticate user & get session token
router.post('/signin', authController.signIn);

module.exports = router;

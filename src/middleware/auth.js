const { supabase } = require('../config/supabase');

/**
 * Authentication middleware that verifies the Supabase access token (JWT)
 * passed in the Authorization header.
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token missing or invalid format. Use Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate the token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
        error: error ? error.message : 'User not found'
      });
    }

    // Attach user information to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
}

module.exports = {
  authenticateUser
};

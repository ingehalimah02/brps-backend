const { supabase, supabaseAdmin } = require('../config/supabase');
const { calculateAge } = require('../utils/ageCalculator');

/**
 * Handles signing up a new user, automatically calculating age, and
 * inserting a corresponding profile record into the public users table.
 */
async function signUp(req, res) {
  const { email, password, name, birthday_date, gender } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Name is required'
    });
  }

  if (!birthday_date) {
    return res.status(400).json({
      success: false,
      message: 'Birthday date is required'
    });
  }

  // Optional gender enum validation
  if (gender && gender !== 'male' && gender !== 'female') {
    return res.status(400).json({
      success: false,
      message: "Gender must be 'male', 'female', or omitted"
    });
  }

  try {
    // 1. Calculate age automatically from birthday date
    let age;
    try {
      age = calculateAge(birthday_date);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid birthday date format. Use YYYY-MM-DD'
      });
    }

    // 2. Register user in Supabase Authentication
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: 'Supabase Auth registration failed',
        error: authError.message
      });
    }

    const authUser = authData.user;
    if (!authUser) {
      return res.status(500).json({
        success: false,
        message: 'Auth user registered but session returned empty. Please check verification requirements (e.g. Email Confirmation).'
      });
    }

    // 3. Create profile in the custom users table using the same UUID
    const { data: userProfile, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.id,
        name,
        birthday_date,
        gender: gender || null,
        age,
        job_role: null, // default to null, set on edit
        department: null, // default to null, set on edit
        years_experience: 0,
        work_hours_per_week: 0,
        remote_ratio: 0.0
      })
      .select()
      .single();

    // 4. In case of DB insert failure, clean up the auth user to keep data in sync
    if (dbError) {
      console.error('Database Sync Error, cleaning up registered Auth User:', dbError);
      
      // Delete user from Supabase Auth admin scope
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);

      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile. Supabase Auth registration rolled back.',
        error: dbError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully and database profile created.',
      data: {
        session: authData.session,
        user: {
          id: authUser.id,
          email: authUser.email,
          profile: userProfile
        }
      }
    });

  } catch (error) {
    console.error('Signup controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
}

/**
 * Handles signing in a registered user to acquire an access token.
 */
async function signIn(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or login failed',
        error: error.message
      });
    }

    // Fetch user profile from database to return together
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user: {
          id: data.user.id,
          email: data.user.email,
          profile: userProfile || null
        }
      }
    });

  } catch (error) {
    console.error('Signin controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
}

/**
 * Handles user sign out by globally invalidating all their sessions via Supabase Auth Admin.
 */
async function signOut(req, res) {
  try {
    const token = req.token;

    // Globally sign out the user from all active sessions using their JWT
    const { error } = await supabaseAdmin.auth.admin.signOut(token);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Sign out failed',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Signed out successfully from all active sessions.'
    });
  } catch (error) {
    console.error('Signout controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during sign out'
    });
  }
}

/**
 * Handles updating the authenticated user's password.
 * Requires verification of their old password before updating.
 */
async function updatePassword(req, res) {
  const { old_password, new_password } = req.body;
  const email = req.user.email;

  if (!old_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Both old password and new password are required'
    });
  }

  if (new_password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  try {
    // 1. Verify old password by attempting a sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: old_password
    });

    if (signInError) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect old password',
        error: signInError.message
      });
    }

    // 2. Update to new password using Supabase Auth Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      req.user.id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Error updating password in Supabase:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update password',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during password update'
    });
  }
}

module.exports = {
  signUp,
  signIn,
  signOut,
  updatePassword
};


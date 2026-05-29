const { supabaseAdmin } = require('../config/supabase');
const { calculateAge } = require('../utils/ageCalculator');

/**
 * Retrieves the current authenticated user's profile.
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        error: error ? error.message : null
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile'
    });
  }
}

/**
 * Updates the current authenticated user's profile with required validations
 * and auto-calculation of age based on birthday.
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const {
      name,
      birthday_date,
      gender,
      job_role,
      department,
      years_experience,
      work_hours_per_week,
      remote_ratio
    } = req.body;

    // 1. Validation for required string/date fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must be a valid string'
      });
    }

    if (!birthday_date) {
      return res.status(400).json({
        success: false,
        message: 'Birthday date is required'
      });
    }

    if (!job_role || typeof job_role !== 'string' || job_role.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Job role is required and must be a valid string'
      });
    }

    if (!department || typeof department !== 'string' || department.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Department is required and must be a valid string'
      });
    }

    // 2. Validate optional gender enum
    if (gender && gender !== 'male' && gender !== 'female') {
      return res.status(400).json({
        success: false,
        message: "Gender must be 'male', 'female', or omitted"
      });
    }

    // 3. Process numeric fields with defaults of 0
    // "untuk type number default 0"
    const parsedYearsExp = parseInt(years_experience, 10);
    const finalYearsExperience = isNaN(parsedYearsExp) ? 0 : parsedYearsExp;

    const parsedWorkHours = parseInt(work_hours_per_week, 10);
    const finalWorkHoursPerWeek = isNaN(parsedWorkHours) ? 0 : parsedWorkHours;

    const parsedRemoteRatio = parseFloat(remote_ratio);
    const finalRemoteRatio = isNaN(parsedRemoteRatio) ? 0.0 : parsedRemoteRatio;

    // 4. Recalculate age automatically from the birthday_date
    let age;
    try {
      age = calculateAge(birthday_date);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid birthday date format. Use YYYY-MM-DD'
      });
    }

    // 5. Update user profile in the database
    const { data: updatedProfile, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        birthday_date,
        gender: gender || null,
        age,
        job_role,
        department,
        years_experience: finalYearsExperience,
        work_hours_per_week: finalWorkHoursPerWeek,
        remote_ratio: finalRemoteRatio
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile in database:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user profile in database',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    console.error('Update profile controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during profile update'
    });
  }
}

module.exports = {
  getProfile,
  updateProfile
};

const { supabaseAdmin } = require('../config/supabase');

/**
 * Validates the parameters for a burnout assessment record (excluding user_id, which is handled via token).
 */
function validateAssessmentBody(body) {
  const { stress_level, workload_level, work_life_balance, job_satisfacation } = body;

  const levels = { stress_level, workload_level, work_life_balance, job_satisfacation };
  for (const [key, value] of Object.entries(levels)) {
    if (value === undefined || value === null) {
      return `${key} is required`;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      return `${key} must be a valid integer`;
    }
  }

  return null;
}

/**
 * POST /api/burnout-assessments
 * Create a new burnout assessment. User ID is automatically inferred from the login session (access token).
 */
async function createAssessment(req, res) {
  try {
    const validationError = validateAssessmentBody(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Inferred automatically from authenticated token!
    const user_id = req.user.id;
    const { stress_level, workload_level, work_life_balance, job_satisfacation } = req.body;

    // Check if the user exists in the database
    const { data: user, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userFetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Associated user profile not found. Please complete profile registration.'
      });
    }

    // Insert into burnout_assessments
    const { data: assessment, error: insertError } = await supabaseAdmin
      .from('burnout_assessments')
      .insert({
        user_id,
        stress_level: parseInt(stress_level, 10),
        workload_level: parseInt(workload_level, 10),
        work_life_balance: parseInt(work_life_balance, 10),
        job_satisfacation: parseInt(job_satisfacation, 10)
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting assessment into database:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create assessment in the database',
        error: insertError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });

  } catch (error) {
    console.error('Create assessment controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during assessment creation'
    });
  }
}

/**
 * GET /api/burnout-assessments
 * Retrieve assessments belonging to the logged-in user (inferred from access token).
 */
async function getAllAssessments(req, res) {
  try {
    // Strictly filter assessments to the authenticated user for data security
    const user_id = req.user.id;

    const { data: assessments, error } = await supabaseAdmin
      .from('burnout_assessments')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments from database:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve assessments',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data: assessments
    });

  } catch (error) {
    console.error('Get all assessments controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching assessments'
    });
  }
}

/**
 * GET /api/burnout-assessments/:id
 * Retrieve a specific assessment by UUID, ensuring it belongs to the logged-in user.
 */
async function getAssessmentById(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const { data: assessment, error } = await supabaseAdmin
      .from('burnout_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
        error: error ? error.message : null
      });
    }

    // Security Check: Only allow users to view their own assessments
    if (assessment.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own assessments.'
      });
    }

    return res.status(200).json({
      success: true,
      data: assessment
    });

  } catch (error) {
    console.error('Get assessment by ID controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving assessment'
    });
  }
}

/**
 * PUT /api/burnout-assessments/:id
 * Update an existing assessment by UUID, ensuring it belongs to the logged-in user.
 */
async function updateAssessment(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const validationError = validateAssessmentBody(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const { stress_level, workload_level, work_life_balance, job_satisfacation } = req.body;

    // Check if the assessment exists
    const { data: existingAssessment, error: fetchError } = await supabaseAdmin
      .from('burnout_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingAssessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Security Check: Only allow users to update their own assessments
    if (existingAssessment.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own assessments.'
      });
    }

    // Update in database
    const { data: updatedAssessment, error: updateError } = await supabaseAdmin
      .from('burnout_assessments')
      .update({
        stress_level: parseInt(stress_level, 10),
        workload_level: parseInt(workload_level, 10),
        work_life_balance: parseInt(work_life_balance, 10),
        job_satisfacation: parseInt(job_satisfacation, 10)
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating assessment in database:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update assessment',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: updatedAssessment
    });

  } catch (error) {
    console.error('Update assessment controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during assessment update'
    });
  }
}

/**
 * DELETE /api/burnout-assessments/:id
 * Delete an assessment by UUID, ensuring it belongs to the logged-in user.
 */
async function deleteAssessment(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const { data: existingAssessment, error: fetchError } = await supabaseAdmin
      .from('burnout_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingAssessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Security Check: Only allow users to delete their own assessments
    if (existingAssessment.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own assessments.'
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('burnout_assessments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting assessment from database:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete assessment',
        error: deleteError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully'
    });

  } catch (error) {
    console.error('Delete assessment controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during assessment deletion'
    });
  }
}

/**
 * POST /api/burnout-assessments/:id/predict
 * Calls the external burnout prediction ML API and updates the assessment database record.
 * Ensures the assessment belongs to the logged-in user.
 */
async function predictBurnout(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // 1. Fetch assessment data from database
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from('burnout_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
        error: assessmentError ? assessmentError.message : null
      });
    }

    // Security Check: Only allow users to trigger prediction for their own assessments
    if (assessment.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only run predictions for your own assessments.'
      });
    }

    // 2. Fetch associated user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', assessment.user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Associated user profile not found',
        error: userError ? userError.message : null
      });
    }

    // 3. Format gender to match ML prediction API requirements (capitalized: 'Male' or 'Female')
    let formattedGender = 'Male';
    if (user.gender) {
      formattedGender = user.gender.charAt(0).toUpperCase() + user.gender.slice(1).toLowerCase();
    }

    // 4. Construct payload for the external prediction API
    const payload = {
      Age: user.age,
      Gender: formattedGender,
      JobRole: user.job_role || 'Unknown',
      Experience: user.years_experience || 0,
      WorkHoursPerWeek: user.work_hours_per_week || 0,
      RemoteRatio: user.remote_ratio || 0.0,
      SatisfactionLevel: assessment.job_satisfacation,
      StressLevel: assessment.stress_level
    };

    // 5. Call external ML prediction API
    const predictionUrl = process.env.BURNOUT_API_URL || 'https://apiburnout-production.up.railway.app/predict';
    
    let apiResponse;
    try {
      apiResponse = await fetch(predictionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (networkError) {
      console.error('Network error calling external prediction API:', networkError);
      return res.status(502).json({
        success: false,
        message: 'Failed to contact external burnout prediction service',
        error: networkError.message
      });
    }

    if (!apiResponse.ok) {
      const responseText = await apiResponse.text();
      console.error('External API responded with error status:', apiResponse.status, responseText);
      return res.status(apiResponse.status).json({
        success: false,
        message: `External prediction service returned status code ${apiResponse.status}`,
        error: responseText
      });
    }

    const apiData = await apiResponse.json();

    // Validate prediction response fields (support data block structure)
    const burnoutScore = apiData.data?.burnout_probability !== undefined 
      ? apiData.data.burnout_probability 
      : apiData.burnout_probability;
      
    const burnoutLabel = apiData.data?.risk_level !== undefined 
      ? apiData.data.risk_level 
      : apiData.risk_level;
      
    const predictionConfidence = apiData.data?.hr_recommendation !== undefined 
      ? apiData.data.hr_recommendation 
      : apiData.hr_recommendation;

    if (burnoutScore === undefined || burnoutLabel === undefined) {
      console.error('Invalid response payload from external prediction API:', apiData);
      return res.status(502).json({
        success: false,
        message: 'Invalid prediction response structure received from external ML service',
        data: apiData
      });
    }

    // 6. Update the assessment in the database with prediction results
    const { data: updatedAssessment, error: updateError } = await supabaseAdmin
      .from('burnout_assessments')
      .update({
        burnout_score: parseFloat(burnoutScore),
        burnout_label: burnoutLabel,
        prediction_confidence: predictionConfidence || null
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating assessment with prediction results:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Prediction was successful, but failed to save results to the database',
        error: updateError.message
      });
    }

    // 7. Return external API response and include the burnout_assessment uuid
    return res.status(200).json({
      ...apiData,
      assessment_id: id,
      burnout_assessment_uuid: id
    });

  } catch (error) {
    console.error('Predict burnout controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during burnout prediction'
    });
  }
}

module.exports = {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  predictBurnout
};

const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { authenticateUser } = require('../middleware/auth');

// Apply authentication middleware to all burnout assessment routes
router.use(authenticateUser);

// POST /api/burnout-assessments - Create a new assessment
router.post('/', assessmentController.createAssessment);

// GET /api/burnout-assessments - Retrieve assessments (optionally filtered by user_id query parameter)
router.get('/', assessmentController.getAllAssessments);

// GET /api/burnout-assessments/:id - Retrieve a specific assessment by UUID
router.get('/:id', assessmentController.getAssessmentById);

// PUT /api/burnout-assessments/:id - Update an existing assessment by UUID
router.put('/:id', assessmentController.updateAssessment);

// DELETE /api/burnout-assessments/:id - Delete an assessment by UUID
router.delete('/:id', assessmentController.deleteAssessment);

// POST /api/burnout-assessments/:id/predict - Call external prediction API and save prediction to database
router.post('/:id/predict', assessmentController.predictBurnout);

module.exports = router;

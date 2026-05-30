const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // HTTP request logging

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Burn Risk Prediction System Backend API is active',
    timestamp: new Date().toISOString()
  });
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/burnout-assessments', assessmentRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Server listener
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);
});

module.exports = app;

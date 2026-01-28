const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/error.middleware');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/patients', require('./routes/patient.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/dental-chart', require('./routes/dentalChart.routes'));
app.use('/api/treatments', require('./routes/treatment.routes'));
app.use('/api/prescriptions', require('./routes/prescription.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/lab-work', require('./routes/labWork.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/settings', require('./routes/setting.routes'));


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'DentaLux API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;

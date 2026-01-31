const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/error.middleware');
const auth = require('./middleware/auth.middleware');
const { requireLicenseActive, requireModuleAccess } = require('./middleware/permissions.middleware');
const { ensureLicenseKey } = require('./config/licenseKey');

// Load environment variables
dotenv.config();
ensureLicenseKey();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));

// Global enforcement for all other /api routes
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  if (req.path.startsWith('/inventory')) return next();
  return auth(req, res, next);
});
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  if (req.path.startsWith('/inventory')) return next();
  return requireLicenseActive(req, res, next);
});

app.use('/api/license', require('./routes/license.routes'));
app.use('/api/dashboard', requireModuleAccess('dashboard'), require('./routes/dashboard.routes'));
app.use('/api/patients', requireModuleAccess('patients'), require('./routes/patient.routes'));
app.use('/api/appointments', requireModuleAccess('appointments'), require('./routes/appointment.routes'));
app.use('/api/dental-chart', requireModuleAccess('dental-chart'), require('./routes/dentalChart.routes'));
app.use('/api/treatments', requireModuleAccess('treatments'), require('./routes/treatment.routes'));
app.use('/api/treatment-procedures', requireModuleAccess('treatments'), require('./routes/treatmentProcedure.routes'));
app.use('/api/prescriptions', requireModuleAccess('prescriptions'), require('./routes/prescription.routes'));
app.use('/api/billing', requireModuleAccess('billing'), require('./routes/billing.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));
app.use('/api/lab-work', requireModuleAccess('lab-work'), require('./routes/labWork.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/staff', requireModuleAccess('staff'), require('./routes/staff.routes'));
app.use('/api/dentists', requireModuleAccess('dentists'), require('./routes/dentist.routes'));
app.use('/api/waiting-list', requireModuleAccess('appointments'), require('./routes/waitingList.routes'));
app.use('/api/reports', requireModuleAccess('reports'), require('./routes/report.routes'));
app.use('/api/documents', requireModuleAccess('documents'), require('./routes/document.routes'));
app.use('/api/settings', requireModuleAccess('settings'), require('./routes/setting.routes'));

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

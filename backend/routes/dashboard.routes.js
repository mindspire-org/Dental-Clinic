const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
// const auth = require('../middleware/auth.middleware');
// const authorize = require('../middleware/role.middleware');


// All routes are now unrestricted for development
// router.use(auth);


// Dashboard routes
router.get('/stats', dashboardController.getStats);
router.get('/recent-activities', dashboardController.getRecentActivities);
router.get('/upcoming-appointments', dashboardController.getUpcomingAppointments);
router.get('/revenue-chart', dashboardController.getRevenueChart);
router.get('/patient-flow', dashboardController.getPatientFlow);

module.exports = router;

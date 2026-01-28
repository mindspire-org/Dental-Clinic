const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');


// All routes require authentication
router.use(auth);


// Dashboard routes
router.get('/stats', authorize('admin', 'dentist', 'receptionist'), dashboardController.getStats);
router.get('/recent-activities', authorize('admin'), dashboardController.getRecentActivities);
router.get('/upcoming-appointments', authorize('admin', 'dentist', 'receptionist'), dashboardController.getUpcomingAppointments);
router.get('/revenue-chart', authorize('admin'), dashboardController.getRevenueChart);

module.exports = router;

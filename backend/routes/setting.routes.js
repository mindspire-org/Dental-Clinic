const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');


// All routes require authentication
router.use(auth);
router.use(authorize('admin'));

// Settings routes
router.get('/', settingController.getAllSettings);
router.get('/:category/:key', settingController.getSetting);
router.put('/clinic', settingController.updateClinicSettings);
router.put('/appointment', settingController.updateAppointmentSettings);
router.put('/billing', settingController.updateBillingSettings);
router.put('/notification', settingController.updateNotificationSettings);

module.exports = router;

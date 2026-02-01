const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
// const auth = require('../middleware/auth.middleware');
// const authorize = require('../middleware/role.middleware');

const auth = require('../middleware/auth.middleware');


// All routes require authentication
// router.use(auth);
router.use(auth);

// Settings routes
router.get('/', settingController.getAllSettings);
router.get('/:category/:key', settingController.getSetting);
router.put('/clinic', settingController.updateClinicSettings);
router.put('/appointment', settingController.updateAppointmentSettings);
router.put('/billing', settingController.updateBillingSettings);
router.put('/notification', settingController.updateNotificationSettings);

module.exports = router;

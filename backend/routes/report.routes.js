const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
// const auth = require('../middleware/auth.middleware');
// const authorize = require('../middleware/role.middleware');

const auth = require('../middleware/auth.middleware');

// router.use(auth);
router.use(auth);

router.get('/financial', reportController.getFinancialReport);
router.get('/clinical', reportController.getClinicalReport);
router.get('/performance', reportController.getPerformanceReport);
router.get('/dashboard-stats', reportController.getDashboardStats);

module.exports = router;

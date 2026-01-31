const express = require('express');
const router = express.Router();
const dentalChartController = require('../controllers/dentalChartController');
// const auth = require('../middleware/auth.middleware');
// const authorize = require('../middleware/role.middleware');

// Dental chart routes
router.get('/patient/:patientId', dentalChartController.getPatientChart);
router.put('/patient/:patientId', dentalChartController.updateChart);
router.post('/patient/:patientId/tooth/:toothNumber', dentalChartController.addToothTreatment);
router.put('/patient/:patientId/tooth/:toothNumber/treatment/:treatmentId', dentalChartController.updateToothTreatment);

module.exports = router;

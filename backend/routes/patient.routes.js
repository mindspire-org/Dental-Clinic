const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
// const auth = require('../middleware/auth.middleware');
// const authorize = require('../middleware/role.middleware');

// All routes are now unrestricted for development
// router.use(auth);

// Routes
router.get('/', patientController.getAllPatients);
router.get('/search', patientController.searchPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', patientController.createPatient);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);
router.get('/:id/appointments', patientController.getPatientAppointments);
router.get('/:id/treatments', patientController.getPatientTreatments);
router.get('/:id/billing', patientController.getPatientBilling);

module.exports = router;

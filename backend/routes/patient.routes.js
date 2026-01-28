const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// All routes require authentication
router.use(auth);

// Routes
router.get('/', patientController.getAllPatients);
router.get('/search', patientController.searchPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', authorize('admin', 'receptionist'), patientController.createPatient);
router.put('/:id', authorize('admin', 'receptionist'), patientController.updatePatient);
router.delete('/:id', authorize('admin'), patientController.deletePatient);
router.get('/:id/appointments', patientController.getPatientAppointments);
router.get('/:id/treatments', patientController.getPatientTreatments);
router.get('/:id/billing', authorize('admin', 'receptionist'), patientController.getPatientBilling);

module.exports = router;

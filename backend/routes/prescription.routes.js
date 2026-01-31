const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
// const auth = require('../middleware/auth.middleware');
// const authorize = require('../middleware/role.middleware');

const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// router.use(auth);
router.use(auth);
router.use(authorize('admin', 'dentist'));

router.get('/', prescriptionController.getAllPrescriptions);
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);
router.get('/:id', prescriptionController.getPrescriptionById);
router.post('/', prescriptionController.createPrescription);
router.put('/:id', prescriptionController.updatePrescription);
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router;

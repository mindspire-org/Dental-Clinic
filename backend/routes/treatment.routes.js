const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatmentController');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(auth);
router.use(authorize('admin', 'dentist'));

router.get('/', treatmentController.getAllTreatments);
router.get('/:id', treatmentController.getTreatmentById);
router.post('/', treatmentController.createTreatment);
router.put('/:id', treatmentController.updateTreatment);
router.delete('/:id', authorize('admin'), treatmentController.deleteTreatment);
router.get('/patient/:patientId', treatmentController.getPatientTreatments);

module.exports = router;

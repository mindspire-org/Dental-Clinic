const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatmentController');
// const auth = require('../middleware/auth.middleware');
// const authorize = require('../middleware/role.middleware');

const auth = require('../middleware/auth.middleware');

// router.use(auth);
if (process.env.NODE_ENV !== 'development') {
    router.use(auth);
}

router.get('/', treatmentController.getAllTreatments);
router.get('/patient/:patientId', treatmentController.getPatientTreatments);
router.get('/:id', treatmentController.getTreatmentById);
router.post('/', treatmentController.createTreatment);
router.put('/:id', treatmentController.updateTreatment);
router.delete('/:id', treatmentController.deleteTreatment);

module.exports = router;

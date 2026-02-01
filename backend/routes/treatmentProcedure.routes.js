const express = require('express');
const router = express.Router();
const treatmentProcedureController = require('../controllers/treatmentProcedureController');

const auth = require('../middleware/auth.middleware');

if (process.env.NODE_ENV !== 'development') {
    router.use(auth);
}

router.get('/', treatmentProcedureController.getAllTreatmentProcedures);
router.get('/:id', treatmentProcedureController.getTreatmentProcedureById);
router.post('/', treatmentProcedureController.createTreatmentProcedure);
router.put('/:id', treatmentProcedureController.updateTreatmentProcedure);
router.delete('/:id', treatmentProcedureController.deleteTreatmentProcedure);

module.exports = router;

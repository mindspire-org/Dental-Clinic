const express = require('express');
const router = express.Router();
const treatmentProcedureController = require('../controllers/treatmentProcedureController');

const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

if (process.env.NODE_ENV !== 'development') {
    router.use(auth);
    router.use(authorize('admin', 'dentist'));
}

router.get('/', treatmentProcedureController.getAllTreatmentProcedures);
router.get('/:id', treatmentProcedureController.getTreatmentProcedureById);
router.post('/', treatmentProcedureController.createTreatmentProcedure);
router.put('/:id', treatmentProcedureController.updateTreatmentProcedure);
router.delete('/:id', treatmentProcedureController.deleteTreatmentProcedure);

module.exports = router;

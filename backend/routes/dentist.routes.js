const express = require('express');
const router = express.Router();
const dentistController = require('../controllers/dentistController');

router.get('/', dentistController.getAllDentists);
router.get('/:id', dentistController.getDentistById);
router.post('/', dentistController.createDentist);
router.put('/:id', dentistController.updateDentist);
router.delete('/:id', dentistController.deleteDentist);

module.exports = router;

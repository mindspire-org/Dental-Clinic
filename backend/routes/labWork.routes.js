const express = require('express');
const router = express.Router();
const labWorkController = require('../controllers/labWorkController');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(auth);
router.use(authorize('admin', 'dentist'));

router.get('/', labWorkController.getAllLabWork);
router.get('/:id', labWorkController.getLabWorkById);
router.post('/', labWorkController.createLabWork);
router.put('/:id', labWorkController.updateLabWork);
router.delete('/:id', labWorkController.deleteLabWork);

module.exports = router;

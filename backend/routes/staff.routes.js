const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(auth);
router.use(authorize('admin'));

router.get('/', staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;

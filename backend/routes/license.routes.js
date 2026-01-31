const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const licenseController = require('../controllers/licenseController');

router.use(auth);
router.use(authorize('superadmin'));

router.get('/modules', licenseController.getAvailableModules);
router.get('/', licenseController.getLicense);
router.post('/activate', licenseController.activateLicense);
router.put('/key', licenseController.setLicenseKey);
router.get('/admins', licenseController.listAdminUsers);
router.put('/admins/permissions', licenseController.setAllAdminPermissions);
router.put('/admins/:adminId/permissions', licenseController.setAdminPermissions);

module.exports = router;

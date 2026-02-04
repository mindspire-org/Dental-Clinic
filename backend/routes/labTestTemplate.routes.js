const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const labTestTemplateController = require('../controllers/labTestTemplateController');

router.use(auth);

router.get('/', labTestTemplateController.getAllTemplates);
router.get('/:id', labTestTemplateController.getTemplateById);
router.post('/', labTestTemplateController.createTemplate);
router.put('/:id', labTestTemplateController.updateTemplate);
router.delete('/:id', labTestTemplateController.deleteTemplate);

module.exports = router;

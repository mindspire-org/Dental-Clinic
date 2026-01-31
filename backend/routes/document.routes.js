const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
// const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware'); // Need to create this one if not exists, for now I'll assume standard multermiddleware or just inline it in controller, but proper structure requires middleware. Actually I missed creating upload.middleware.js in the previous steps. I should create it.

// router.use(auth);

router.get('/', documentController.getAllDocuments);
router.get('/patient/:patientId', documentController.getPatientDocuments);
router.get('/:id', documentController.getDocumentById);
router.post('/upload', upload.single('file'), documentController.uploadDocument); // Will handle validation inside controller or specific middleware
router.post('/folders', documentController.createFolder);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;

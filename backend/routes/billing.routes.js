const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(auth);
router.use(authorize('admin', 'receptionist'));

router.get('/invoices', billingController.getAllInvoices);
router.get('/invoices/:id', billingController.getInvoiceById);
router.post('/invoices', billingController.createInvoice);
router.put('/invoices/:id', billingController.updateInvoice);
router.delete('/invoices/:id', billingController.deleteInvoice);
router.post('/payments', billingController.recordPayment);
router.get('/reports/revenue', authorize('admin'), billingController.getRevenueReport);

module.exports = router;

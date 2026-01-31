const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const checkupBillingController = require('../controllers/checkupBillingController');
const procedureBillingController = require('../controllers/procedureBillingController');
const labBillingController = require('../controllers/labBillingController');
const prescriptionBillingController = require('../controllers/prescriptionBillingController');

// Standard invoice routes
router.get('/invoices', billingController.getAllInvoices);
router.get('/invoices/:id', billingController.getInvoiceById);
router.post('/invoices', billingController.createInvoice);
router.put('/invoices/:id', billingController.updateInvoice);
router.delete('/invoices/:id', billingController.deleteInvoice);
router.post('/invoices/:id/print', billingController.markPrinted);

// Payment routes
router.get('/payments', billingController.getAllPayments);
router.post('/payments', billingController.recordPayment);

// Insurance routes
router.get('/insurance', billingController.getAllInsuranceClaims);
router.post('/insurance', billingController.createInsuranceClaim);

// Checkup billing routes
router.get('/checkup/appointments', checkupBillingController.getAppointmentsForBilling);
router.post('/checkup', checkupBillingController.createCheckupBill);
router.put('/checkup/:id', checkupBillingController.updateCheckupBill);
router.delete('/checkup/:id', checkupBillingController.deleteCheckupBill);
router.get('/checkup/:id/receipt', checkupBillingController.getCheckupReceipt);
router.get('/checkup/stats', checkupBillingController.getCheckupBillingStats);

// Procedure billing routes
router.get('/procedure/treatments', procedureBillingController.getTreatmentsForBilling);
router.post('/procedure', procedureBillingController.createProcedureBill);
router.put('/procedure/:id', procedureBillingController.updateProcedureBill);
router.delete('/procedure/:id', procedureBillingController.deleteProcedureBill);
router.get('/procedure/:id/receipt', procedureBillingController.getProcedureReceipt);
router.get('/procedure/stats', procedureBillingController.getProcedureBillingStats);

// Lab billing routes
router.get('/lab/labwork', labBillingController.getLabWorkForBilling);
router.post('/lab', labBillingController.createLabBill);
router.put('/lab/:id', labBillingController.updateLabBill);
router.delete('/lab/:id', labBillingController.deleteLabBill);
router.get('/lab/:id/receipt', labBillingController.getLabReceipt);
router.get('/lab/stats', labBillingController.getLabBillingStats);

// Prescription billing routes
router.get('/prescription/prescriptions', prescriptionBillingController.getPrescriptionsForBilling);
router.post('/prescription', prescriptionBillingController.createPrescriptionBill);
router.put('/prescription/:id', prescriptionBillingController.updatePrescriptionBill);
router.delete('/prescription/:id', prescriptionBillingController.deletePrescriptionBill);
router.get('/prescription/:id/receipt', prescriptionBillingController.getPrescriptionReceipt);
router.get('/prescription/stats', prescriptionBillingController.getPrescriptionBillingStats);

// Reports
router.get('/reports/revenue', billingController.getRevenueReport);

module.exports = router;


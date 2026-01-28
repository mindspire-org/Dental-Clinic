const Billing = require('../models/Billing');

exports.getAllInvoices = async (req, res, next) => {
    try {
        const bills = await Billing.find().populate('patient').sort('-createdAt');
        res.status(200).json({ status: 'success', data: { bills } });
    } catch (error) { next(error); }
};

exports.getInvoiceById = async (req, res, next) => {
    try {
        const bill = await Billing.findById(req.params.id).populate('patient');
        if (!bill) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { bill } });
    } catch (error) { next(error); }
};

exports.createInvoice = async (req, res, next) => {
    try {
        const bill = await Billing.create(req.body);
        res.status(201).json({ status: 'success', data: { bill } });
    } catch (error) { next(error); }
};

exports.updateInvoice = async (req, res, next) => {
    try {
        const bill = await Billing.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: 'success', data: { bill } });
    } catch (error) { next(error); }
};

exports.deleteInvoice = async (req, res, next) => {
    try {
        await Billing.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

exports.recordPayment = async (req, res, next) => {
    // Logic to add payment to invoice
    try {
        const { invoiceId, amount } = req.body;
        const bill = await Billing.findById(invoiceId);
        if (!bill) return res.status(404).json({ message: 'Invoice not found' });
        bill.paidAmount += amount;
        if (bill.paidAmount >= bill.total) bill.status = 'paid';
        else bill.status = 'partially-paid';
        await bill.save();
        res.status(200).json({ status: 'success', data: { bill } });
    } catch (error) { next(error); }
};

exports.getRevenueReport = async (req, res, next) => {
    // Placeholder for aggregation
    res.status(200).json({ status: 'success', data: { revenue: 0 } });
};

const Billing = require('../models/Billing');
const Payment = require('../models/Payment');
const Insurance = require('../models/Insurance');
const Appointment = require('../models/Appointment');
const Treatment = require('../models/Treatment');
const LabWork = require('../models/LabWork');
const Prescription = require('../models/Prescription');

const getDentistInvoiceIds = async (dentistId) => {
    const [appointmentIds, treatmentIds, labWorkIds, prescriptionIds] = await Promise.all([
        Appointment.find({ dentist: dentistId }).distinct('_id'),
        Treatment.find({ dentist: dentistId }).distinct('_id'),
        LabWork.find({ dentist: dentistId }).distinct('_id'),
        Prescription.find({ dentist: dentistId }).distinct('_id'),
    ]);

    const ids = await Billing.find({
        $or: [
            { appointment: { $in: appointmentIds } },
            { treatment: { $in: treatmentIds } },
            { labWork: { $in: labWorkIds } },
            { prescription: { $in: prescriptionIds } },
        ],
    }).distinct('_id');

    return ids;
};

const mapInvoice = (bill) => {
    const patient = bill?.patient
        ? { firstName: bill.patient.firstName, lastName: bill.patient.lastName }
        : (() => {
            const parts = String(bill?.patientName || '').trim().split(/\s+/).filter(Boolean);
            if (parts.length >= 2) return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1).join(' ') };
            if (parts.length === 1) return { firstName: parts[0], lastName: '' };
            return { firstName: '-', lastName: '-' };
        })();

    const total = Number(bill?.total || 0);
    const paidAmount = Number(bill?.paidAmount || 0);
    const balance = Math.max(0, total - paidAmount);

    const status = String(bill?.status || 'pending').toLowerCase();

    return {
        _id: bill._id,
        invoiceId: bill.invoiceNumber,
        patient,
        amount: total,
        balance,
        status,
        dueDate: bill.dueDate || bill.createdAt,
        createdAt: bill.createdAt,
    };
};

exports.getAllInvoices = async (req, res, next) => {
    try {
        const query = {};
        const { invoiceType, status, patientId } = req.query;
        if (invoiceType) query.invoiceType = String(invoiceType);
        if (status) query.status = String(status);
        if (patientId) query.patient = patientId;

        if (req.user?.role === 'dentist' && req.user?._id) {
            const ids = await getDentistInvoiceIds(req.user._id);
            query._id = { $in: ids };
        }

        const bills = await Billing.find(query).populate('patient', 'firstName lastName').sort('-createdAt');
        const invoices = bills.map(mapInvoice);
        res.status(200).json({ status: 'success', data: { invoices, bills } });
    } catch (error) { next(error); }
};

exports.getInvoiceById = async (req, res, next) => {
    try {
        if (req.user?.role === 'dentist' && req.user?._id) {
            const ids = await getDentistInvoiceIds(req.user._id);
            if (!ids.map(String).includes(String(req.params.id))) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        const bill = await Billing.findById(req.params.id).populate('patient', 'firstName lastName');
        if (!bill) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { invoice: mapInvoice(bill), bill } });
    } catch (error) { next(error); }
};

exports.createInvoice = async (req, res, next) => {
    try {
        const body = req.body || {};
        const amount = Number(body.amount);
        const items = Array.isArray(body.items) ? body.items : undefined;

        const payload = {
            patient: body.patient || undefined,
            patientName: body.patientName || undefined,
            dueDate: body.dueDate || undefined,
            tax: body.tax || 0,
            discount: body.discount || 0,
            status: body.status || 'pending',
            paidAmount: body.paidAmount || 0,
            items: items || (Number.isFinite(amount) && amount > 0 ? [{ description: 'Services', quantity: 1, unitPrice: amount }] : []),
            notes: body.notes || undefined,
        };

        const bill = await Billing.create(payload);
        const populated = await Billing.findById(bill._id).populate('patient', 'firstName lastName');
        res.status(201).json({ status: 'success', data: { invoice: mapInvoice(populated), bill: populated } });
    } catch (error) { next(error); }
};

exports.updateInvoice = async (req, res, next) => {
    try {
        const bill = await Billing.findById(req.params.id);
        if (!bill) return res.status(404).json({ status: 'error', message: 'Not found' });

        const body = req.body || {};
        if (body.patient !== undefined) bill.patient = body.patient;
        if (body.patientName !== undefined) bill.patientName = body.patientName;
        if (body.dueDate !== undefined) bill.dueDate = body.dueDate;
        if (body.tax !== undefined) bill.tax = body.tax;
        if (body.discount !== undefined) bill.discount = body.discount;
        if (body.status !== undefined) bill.status = body.status;
        if (body.items !== undefined) bill.items = body.items;
        if (body.notes !== undefined) bill.notes = body.notes;
        if (body.amount !== undefined && (body.items === undefined)) {
            const amount = Number(body.amount);
            if (Number.isFinite(amount) && amount > 0) {
                bill.items = [{ description: 'Services', quantity: 1, unitPrice: amount }];
            }
        }
        await bill.save();
        const populated = await Billing.findById(bill._id).populate('patient', 'firstName lastName');
        res.status(200).json({ status: 'success', data: { invoice: mapInvoice(populated), bill: populated } });
    } catch (error) { next(error); }
};

exports.deleteInvoice = async (req, res, next) => {
    try {
        if (req.user?.role === 'dentist' && req.user?._id) {
            const ids = await getDentistInvoiceIds(req.user._id);
            if (!ids.map(String).includes(String(req.params.id))) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }
        await Billing.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

exports.markPrinted = async (req, res, next) => {
    try {
        if (req.user?.role === 'dentist' && req.user?._id) {
            const ids = await getDentistInvoiceIds(req.user._id);
            if (!ids.map(String).includes(String(req.params.id))) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }
        res.status(200).json({ status: 'success', data: { printed: true } });
    } catch (error) { next(error); }
};

exports.recordPayment = async (req, res, next) => {
    // Logic to add payment to invoice
    try {
        const { invoiceId, amount, paymentMethod, transactionId, notes, paymentDate } = req.body || {};

        if (req.user?.role === 'dentist' && req.user?._id) {
            const ids = await getDentistInvoiceIds(req.user._id);
            if (!ids.map(String).includes(String(invoiceId))) {
                return res.status(404).json({ message: 'Invoice not found' });
            }
        }

        const bill = await Billing.findById(invoiceId);
        if (!bill) return res.status(404).json({ message: 'Invoice not found' });

        const amt = Number(amount || 0);
        if (!Number.isFinite(amt) || amt <= 0) {
            return res.status(400).json({ status: 'error', message: 'amount must be a positive number' });
        }

        const pay = await Payment.create({
            invoice: bill._id,
            patient: bill.patient,
            amount: amt,
            paymentMethod: paymentMethod || 'cash',
            transactionId,
            notes,
            paymentDate: paymentDate || undefined,
            status: 'completed',
        });

        bill.paidAmount = Number(bill.paidAmount || 0) + amt;
        if (bill.paidAmount >= bill.total) bill.status = 'paid';
        else bill.status = 'partially-paid';
        await bill.save();

        if (String(bill.invoiceType || '').toLowerCase() === 'procedure') {
            const ids = Array.isArray(bill?.billingContext?.treatmentIds)
                ? bill.billingContext.treatmentIds
                : (bill.treatment ? [bill.treatment] : []);

            if (ids.length) {
                const share = amt / ids.length;
                await Treatment.updateMany(
                    { _id: { $in: ids } },
                    { $inc: { paidAmount: share } }
                );
            }
        }

        const populated = await Billing.findById(bill._id).populate('patient', 'firstName lastName');
        res.status(200).json({ status: 'success', data: { payment: pay, invoice: mapInvoice(populated) } });
    } catch (error) { next(error); }
};

exports.getAllPayments = async (req, res, next) => {
    try {
        const query = {};
        if (req.user?.role === 'dentist' && req.user?._id) {
            const ids = await getDentistInvoiceIds(req.user._id);
            query.invoice = { $in: ids };
        }

        const payments = await Payment.find(query)
            .populate('invoice', 'invoiceNumber')
            .populate('patient', 'firstName lastName')
            .sort('-createdAt');
        res.status(200).json({ status: 'success', data: { payments } });
    } catch (error) { next(error); }
};

exports.getAllInsuranceClaims = async (req, res, next) => {
    try {
        const claims = await Insurance.find().populate('patient', 'firstName lastName').sort('-createdAt');
        res.status(200).json({ status: 'success', data: { claims } });
    } catch (error) { next(error); }
};

exports.createInsuranceClaim = async (req, res, next) => {
    try {
        const body = req.body || {};
        const claim = await Insurance.create({
            patient: body.patient || undefined,
            patientName: body.patientName || undefined,
            provider: body.provider,
            policyNumber: body.policyNumber,
            groupNumber: body.groupNumber,
            claimAmount: body.claimAmount,
            approvedAmount: body.approvedAmount || 0,
            status: body.status || 'pending',
            submittedDate: body.submittedDate || new Date(),
            processedDate: body.processedDate,
            rejectionReason: body.rejectionReason,
            notes: body.notes,
        });
        const populated = await Insurance.findById(claim._id).populate('patient', 'firstName lastName');
        res.status(201).json({ status: 'success', data: { claim: populated } });
    } catch (error) { next(error); }
};

exports.getRevenueReport = async (req, res, next) => {
    // Placeholder for aggregation
    res.status(200).json({ status: 'success', data: { revenue: 0 } });
};

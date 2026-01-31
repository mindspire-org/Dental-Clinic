const LabWork = require('../models/LabWork');
const Billing = require('../models/Billing');

const buildReceipt = (invoice) => {
    const inv = invoice?.toObject ? invoice.toObject() : invoice;
    const items = Array.isArray(inv?.items) ? inv.items : [];
    const subtotal = Number(inv?.subtotal || items.reduce((s, it) => s + Number(it.total || (Number(it.quantity || 0) * Number(it.unitPrice || 0))), 0));
    const tax = Number(inv?.tax || 0);
    const discount = Number(inv?.discount || 0);
    const total = Number(inv?.total || Math.max(0, subtotal + tax - discount));
    const paidAmount = Number(inv?.paidAmount || 0);
    const balance = Math.max(0, total - paidAmount);

    return {
        clinic: { name: 'DentalVerse Elite' },
        patient: inv?.patient,
        invoice: {
            _id: inv?._id,
            invoiceNumber: inv?.invoiceNumber,
            invoiceType: inv?.invoiceType,
            status: inv?.status,
            createdAt: inv?.createdAt,
            dueDate: inv?.dueDate,
            notes: inv?.notes,
        },
        items: items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
        })),
        financial: { subtotal, tax, discount, total, paidAmount, balance },
    };
};

exports.updateLabBill = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'lab') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        const ids = Array.isArray(invoice?.billingContext?.labWorkIds)
            ? invoice.billingContext.labWorkIds
            : (invoice.labWork ? [invoice.labWork] : []);

        if (req.user?.role === 'dentist' && req.user?._id && ids.length) {
            const count = await LabWork.countDocuments({ _id: { $in: ids }, dentist: req.user._id });
            if (count !== ids.length) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        const { labCost, notes, dueDate, paidAmount } = req.body || {};
        if (labCost !== undefined) {
            const cost = Number(labCost);
            if (Array.isArray(invoice.items) && invoice.items.length) {
                invoice.items = invoice.items.map((it, idx) => (
                    idx === 0
                        ? { description: it.description, quantity: 1, unitPrice: cost }
                        : it
                ));
            } else {
                invoice.items = [{ description: 'Lab Work', quantity: 1, unitPrice: cost }];
            }
        }
        if (notes !== undefined) invoice.notes = notes;
        if (dueDate !== undefined) invoice.dueDate = dueDate;
        if (paidAmount !== undefined) invoice.paidAmount = Number(paidAmount);

        await invoice.save();
        const populated = await Billing.findById(invoice._id)
            .populate('patient', 'firstName lastName email phone')
            .populate('labWork');
        res.status(200).json({ status: 'success', data: { invoice: populated } });
    } catch (error) {
        next(error);
    }
};

exports.deleteLabBill = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'lab') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        const ids = Array.isArray(invoice?.billingContext?.labWorkIds)
            ? invoice.billingContext.labWorkIds
            : (invoice.labWork ? [invoice.labWork] : []);

        if (req.user?.role === 'dentist' && req.user?._id && ids.length) {
            const count = await LabWork.countDocuments({ _id: { $in: ids }, dentist: req.user._id });
            if (count !== ids.length) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        if (ids.length) {
            await LabWork.updateMany({ _id: { $in: ids } }, { $set: { invoice: null } });
        }

        await Billing.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

exports.getLabReceipt = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id)
            .populate('patient', 'firstName lastName email phone')
            .populate('labWork');

        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'lab') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        const ids = Array.isArray(invoice?.billingContext?.labWorkIds)
            ? invoice.billingContext.labWorkIds
            : (invoice.labWork ? [invoice.labWork] : []);

        if (req.user?.role === 'dentist' && req.user?._id && ids.length) {
            const count = await LabWork.countDocuments({ _id: { $in: ids }, dentist: req.user._id });
            if (count !== ids.length) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        res.status(200).json({ status: 'success', data: { receipt: buildReceipt(invoice) } });
    } catch (error) {
        next(error);
    }
};

exports.getLabWorkForBilling = async (req, res, next) => {
    try {
        const { patientId, status, startDate, endDate } = req.query;

        const allowedStatuses = ['requested', 'in-progress', 'completed', 'delivered'];
        const resolvedStatus = status ? String(status) : null;

        const query = {
            paymentStatus: { $in: ['unpaid', 'partial'] },
            status: resolvedStatus ? resolvedStatus : { $in: allowedStatuses },
            invoice: { $eq: null },
        };

        if (patientId) query.patient = patientId;
        if (resolvedStatus) query.status = resolvedStatus;

        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        if (startDate || endDate) {
            query.requestDate = {};
            if (startDate) query.requestDate.$gte = new Date(startDate);
            if (endDate) query.requestDate.$lte = new Date(endDate);
        }

        const labWork = await LabWork.find(query)
            .populate('patient', 'firstName lastName email phone')
            .populate('dentist', 'firstName lastName email')
            .populate('treatment')
            .populate('invoice')
            .sort('-requestDate');

        res.status(200).json({
            status: 'success',
            data: { labWork }
        });
    } catch (error) {
        next(error);
    }
};

exports.createLabBill = async (req, res, next) => {
    try {
        const { labWorkIds, labWorkId, labCost, notes, dueDate, paidAmount = 0 } = req.body;

        const finalIds = Array.isArray(labWorkIds) && labWorkIds.length
            ? labWorkIds
            : (labWorkId ? [labWorkId] : []);

        if (!Array.isArray(finalIds) || finalIds.length === 0) {
            return res.status(400).json({ status: 'error', message: 'At least one lab work ID is required' });
        }

        const labWorks = await LabWork.find({ _id: { $in: finalIds } })
            .populate('patient', 'firstName lastName')
            .populate('dentist', 'firstName lastName');

        if (labWorks.length === 0) {
            return res.status(404).json({ status: 'error', message: 'No lab work found' });
        }

        if (req.user?.role === 'dentist' && req.user?._id) {
            const ok = labWorks.every((lw) => String(lw.dentist?._id || lw.dentist) === String(req.user._id));
            if (!ok) {
                return res.status(404).json({ status: 'error', message: 'No lab work found' });
            }
        }

        const patientId = String(labWorks[0].patient?._id || labWorks[0].patient);
        const allSamePatient = labWorks.every((lw) => String(lw.patient?._id || lw.patient) === patientId);
        if (!allSamePatient) {
            return res.status(400).json({ status: 'error', message: 'All lab work must belong to the same patient' });
        }

        const resolvedLabCost = finalIds.length === 1 && labCost !== undefined
            ? Number(labCost)
            : undefined;

        const items = labWorks.map((lw) => ({
            description: `${lw.workType} - ${lw.labName}`,
            quantity: 1,
            unitPrice: Number.isFinite(resolvedLabCost) ? resolvedLabCost : Number(lw.cost || 0),
        }));

        const invoiceData = {
            patient: labWorks[0].patient._id,
            patientName: `${labWorks[0].patient.firstName} ${labWorks[0].patient.lastName}`,
            invoiceType: 'lab',
            labWork: labWorks[0]._id,
            items,
            dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            notes: notes || `Lab charges for ${labWorks.length} lab work order(s)`,
            paidAmount,
            billingContext: {
                labWorkIds: labWorks.map((lw) => lw._id),
                labOrders: labWorks.map((lw) => ({
                    id: lw._id,
                    workType: lw.workType,
                    labName: lw.labName,
                    cost: lw.cost,
                    status: lw.status,
                })),
            },
        };

        const invoice = await Billing.create(invoiceData);

        await Promise.all(labWorks.map(async (lw) => {
            lw.invoice = invoice._id;
            if (paidAmount > 0) {
                const share = paidAmount / labWorks.length;
                lw.paidAmount = share;
                lw.paymentStatus = share >= Number(lw.cost || 0) ? 'paid' : 'partial';
            }
            await lw.save();
        }));

        const populated = await Billing.findById(invoice._id)
            .populate('patient', 'firstName lastName email phone')
            .populate('labWork');

        res.status(201).json({ status: 'success', data: { invoice: populated } });
    } catch (error) {
        next(error);
    }
};

exports.getLabBillingStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const matchQuery = { invoiceType: 'lab' };

        if (req.user?.role === 'dentist' && req.user?._id) {
            const ids = await LabWork.find({ dentist: req.user._id }).distinct('_id');
            matchQuery.labWork = { $in: ids };
        }

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        const stats = await Billing.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalPaid: { $sum: '$paidAmount' },
                    totalPending: { $sum: { $subtract: ['$total', '$paidAmount'] } },
                    count: { $sum: 1 },
                    avgLabCost: { $avg: '$total' }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                summary: stats[0] || {
                    totalRevenue: 0,
                    totalPaid: 0,
                    totalPending: 0,
                    count: 0,
                    avgLabCost: 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

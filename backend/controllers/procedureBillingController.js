const Treatment = require('../models/Treatment');
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

exports.updateProcedureBill = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'procedure') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        const ids = Array.isArray(invoice?.billingContext?.treatmentIds)
            ? invoice.billingContext.treatmentIds
            : (invoice.treatment ? [invoice.treatment] : []);

        if (req.user?.role === 'dentist' && req.user?._id && ids.length) {
            const count = await Treatment.countDocuments({ _id: { $in: ids }, dentist: req.user._id });
            if (count !== ids.length) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        const { procedureCost, notes, dueDate } = req.body || {};
        if (procedureCost !== undefined) {
            const cost = Number(procedureCost);
            if (Array.isArray(invoice.items) && invoice.items.length) {
                invoice.items = invoice.items.map((it, idx) => (
                    idx === 0
                        ? { description: it.description, quantity: 1, unitPrice: cost }
                        : it
                ));
            } else {
                invoice.items = [{ description: 'Procedure', quantity: 1, unitPrice: cost }];
            }
        }
        if (notes !== undefined) invoice.notes = notes;
        if (dueDate !== undefined) invoice.dueDate = dueDate;

        await invoice.save();

        const populated = await Billing.findById(invoice._id)
            .populate('patient', 'firstName lastName email phone')
            .populate('treatment');
        res.status(200).json({ status: 'success', data: { invoice: populated } });
    } catch (error) {
        next(error);
    }
};

exports.deleteProcedureBill = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'procedure') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        const ids = Array.isArray(invoice?.billingContext?.treatmentIds)
            ? invoice.billingContext.treatmentIds
            : (invoice.treatment ? [invoice.treatment] : []);

        if (req.user?.role === 'dentist' && req.user?._id && ids.length) {
            const count = await Treatment.countDocuments({ _id: { $in: ids }, dentist: req.user._id });
            if (count !== ids.length) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        if (ids.length) {
            await Treatment.updateMany({ _id: { $in: ids } }, { $set: { invoice: null } });
        }

        await Billing.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

exports.getProcedureReceipt = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id)
            .populate('patient', 'firstName lastName email phone')
            .populate('treatment');

        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'procedure') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        const ids = Array.isArray(invoice?.billingContext?.treatmentIds)
            ? invoice.billingContext.treatmentIds
            : (invoice.treatment ? [invoice.treatment] : []);

        if (req.user?.role === 'dentist' && req.user?._id && ids.length) {
            const count = await Treatment.countDocuments({ _id: { $in: ids }, dentist: req.user._id });
            if (count !== ids.length) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        res.status(200).json({ status: 'success', data: { receipt: buildReceipt(invoice) } });
    } catch (error) {
        next(error);
    }
};

// Get treatments ready for billing
exports.getTreatmentsForBilling = async (req, res, next) => {
    try {
        const { patientId, dentistId, status, startDate, endDate } = req.query;

        const query = {};

        if (patientId) query.patient = patientId;
        if (dentistId) query.dentist = dentistId;
        if (status) query.status = status;

        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        // only show items not already invoiced
        query.invoice = { $eq: null };

        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        const treatments = await Treatment.find(query)
            .populate('patient', 'firstName lastName email phone')
            .populate('dentist', 'firstName lastName email')
            .populate('procedure', 'name price description')
            .populate('invoice')
            .sort('-startDate');

        res.status(200).json({
            status: 'success',
            data: { treatments }
        });
    } catch (error) {
        next(error);
    }
};

// Create procedure invoice with advance payment enforcement
exports.createProcedureBill = async (req, res, next) => {
    try {
        const {
            treatmentIds, // Array of treatment IDs
            treatmentId, // single treatment id (frontend)
            procedureCost,
            notes,
            dueDate,
            advancePaymentPercentage = 25
        } = req.body;

        const finalTreatmentIds = Array.isArray(treatmentIds) && treatmentIds.length
            ? treatmentIds
            : (treatmentId ? [treatmentId] : []);

        if (!finalTreatmentIds || !Array.isArray(finalTreatmentIds) || finalTreatmentIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'At least one treatment ID is required'
            });
        }

        // Fetch all treatments
        const treatments = await Treatment.find({ _id: { $in: finalTreatmentIds } })
            .populate('patient', 'firstName lastName')
            .populate('dentist', 'firstName lastName')
            .populate('procedure', 'name price description');

        if (treatments.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No treatments found'
            });
        }

        // Check if all treatments belong to same patient
        const patientId = treatments[0].patient._id.toString();
        const allSamePatient = treatments.every(t => t.patient._id.toString() === patientId);

        if (!allSamePatient) {
            return res.status(400).json({
                status: 'error',
                message: 'All treatments must belong to the same patient'
            });
        }

        if (req.user?.role === 'dentist' && req.user?._id) {
            const ok = treatments.every((t) => String(t.dentist?._id || t.dentist) === String(req.user._id));
            if (!ok) {
                return res.status(404).json({ status: 'error', message: 'No treatments found' });
            }
        }

        // Build invoice items
        const resolvedProcedureCost = finalTreatmentIds.length === 1 && procedureCost !== undefined
            ? Number(procedureCost)
            : undefined;

        const items = treatments.map((treatment) => {
            const baseCost = treatment.actualCost || treatment.estimatedCost || treatment.procedure?.price || 0;
            const cost = Number.isFinite(resolvedProcedureCost) ? resolvedProcedureCost : baseCost;
            const description = treatment.procedure?.name || treatment.description || treatment.treatmentType;

            return {
                description: `${description} - ${treatment.teeth?.join(', ') || 'N/A'}`,
                quantity: 1,
                unitPrice: cost
            };
        });

        // Calculate total
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        const minAdvance = subtotal * (advancePaymentPercentage / 100);

        // Create invoice
        const invoiceData = {
            patient: treatments[0].patient._id,
            patientName: `${treatments[0].patient.firstName} ${treatments[0].patient.lastName}`,
            invoiceType: 'procedure',
            treatment: treatments[0]._id, // Primary treatment
            items,
            dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            notes: notes || `Procedure fees for ${treatments.length} treatment(s)`,
            requiresAdvance: false,
            advancePayment: 0,
            advancePaymentPercentage,
            paidAmount: 0,
            billingContext: {
                treatmentIds: treatments.map(t => t._id),
                procedures: treatments.map(t => ({
                    id: t._id,
                    type: t.treatmentType,
                    description: t.description,
                    cost: t.actualCost || t.estimatedCost
                }))
            }
        };

        const invoice = await Billing.create(invoiceData);

        // Update treatments with invoice reference and advance payment
        await Promise.all(treatments.map(async (treatment) => {
            treatment.invoice = invoice._id;
            await treatment.save();
        }));

        const populated = await Billing.findById(invoice._id)
            .populate('patient', 'firstName lastName email phone')
            .populate('treatment');

        res.status(201).json({
            status: 'success',
            data: {
                invoice: populated,
                advanceInfo: {
                    required: minAdvance,
                    paid: 0,
                    percentage: advancePaymentPercentage,
                    balance: subtotal
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get procedure billing stats
exports.getProcedureBillingStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const matchQuery = { invoiceType: 'procedure' };

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
                    totalAdvance: { $sum: '$advancePayment' },
                    totalPaid: { $sum: '$paidAmount' },
                    totalPending: { $sum: { $subtract: ['$total', '$paidAmount'] } },
                    count: { $sum: 1 },
                    avgProcedureCost: { $avg: '$total' }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                summary: stats[0] || {
                    totalRevenue: 0,
                    totalAdvance: 0,
                    totalPaid: 0,
                    totalPending: 0,
                    count: 0,
                    avgProcedureCost: 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

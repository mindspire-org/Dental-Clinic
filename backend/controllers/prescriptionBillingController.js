const Prescription = require('../models/Prescription');
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

// Get prescriptions ready for billing
exports.getPrescriptionsForBilling = async (req, res, next) => {
    try {
        const { patientId, status = 'active', startDate, endDate } = req.query;

        const query = { status, invoice: { $eq: null } };

        if (patientId) query.patient = patientId;

        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        if (startDate || endDate) {
            query.prescriptionDate = {};
            if (startDate) query.prescriptionDate.$gte = new Date(startDate);
            if (endDate) query.prescriptionDate.$lte = new Date(endDate);
        }

        const prescriptions = await Prescription.find(query)
            .populate('patient', 'firstName lastName email phone')
            .populate('dentist', 'firstName lastName email')
            .populate('treatment')
            .populate('invoice')
            .sort('-prescriptionDate');

        res.status(200).json({
            status: 'success',
            data: { prescriptions }
        });
    } catch (error) {
        next(error);
    }
};

// Create prescription invoice
exports.createPrescriptionBill = async (req, res, next) => {
    try {
        const { prescriptionId, medications, notes, dueDate, paidAmount = 0 } = req.body;

        const prescription = await Prescription.findById(prescriptionId)
            .populate('patient', 'firstName lastName')
            .populate('dentist', 'firstName lastName');

        if (!prescription) {
            return res.status(404).json({
                status: 'error',
                message: 'Prescription not found'
            });
        }

        if (req.user?.role === 'dentist' && req.user?._id && String(prescription.dentist?._id) !== String(req.user._id)) {
            return res.status(404).json({ status: 'error', message: 'Prescription not found' });
        }

        if (prescription.invoice) {
            return res.status(400).json({
                status: 'error',
                message: 'Prescription already billed'
            });
        }

        // Use provided medications or prescription's medications
        const meds = medications || prescription.medications;

        if (!meds || meds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No medications found'
            });
        }

        // Build invoice items from medications
        const items = meds.map(med => {
            const quantity = med.quantity || 1;
            const unitPrice = med.unitPrice || 0;
            const total = quantity * unitPrice;

            return {
                description: `${med.name} - ${med.dosage} (${med.frequency} for ${med.duration})`,
                quantity,
                unitPrice
            };
        });

        // Calculate total cost
        const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        // Create invoice
        const invoiceData = {
            patient: prescription.patient._id,
            patientName: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
            invoiceType: 'prescription',
            prescription: prescription._id,
            items,
            dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            notes: notes || `Prescription medicines - ${prescription.prescriptionNumber}`,
            paidAmount,
            billingContext: {
                prescriptionNumber: prescription.prescriptionNumber,
                prescriptionDate: prescription.prescriptionDate,
                dentist: {
                    id: prescription.dentist._id,
                    name: `${prescription.dentist.firstName} ${prescription.dentist.lastName}`
                },
                medications: meds.map(m => ({
                    name: m.name,
                    dosage: m.dosage,
                    quantity: m.quantity || 1,
                    unitPrice: m.unitPrice || 0,
                    totalPrice: (m.quantity || 1) * (m.unitPrice || 0)
                }))
            }
        };

        const invoice = await Billing.create(invoiceData);

        // Update prescription with invoice reference and cost
        prescription.invoice = invoice._id;
        prescription.totalCost = totalCost;
        prescription.paidAmount = paidAmount;

        // Update medications with pricing if provided
        if (medications) {
            prescription.medications = medications;
        }

        await prescription.save();

        const populated = await Billing.findById(invoice._id)
            .populate('patient', 'firstName lastName email phone')
            .populate('prescription');

        res.status(201).json({
            status: 'success',
            data: { invoice: populated }
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePrescriptionBill = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'prescription') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        if (req.user?.role === 'dentist' && req.user?._id && invoice.prescription) {
            const p = await Prescription.findById(invoice.prescription).select('dentist');
            if (!p || String(p.dentist) !== String(req.user._id)) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        const { medications, notes, dueDate, paidAmount } = req.body || {};

        if (Array.isArray(medications)) {
            invoice.items = medications.map((med) => ({
                description: `${med.name || ''} - ${med.dosage || ''} (${med.frequency || ''} for ${med.duration || ''})`.trim(),
                quantity: Number(med.quantity || 1),
                unitPrice: Number(med.unitPrice || 0),
            }));
        }
        if (notes !== undefined) invoice.notes = notes;
        if (dueDate !== undefined) invoice.dueDate = dueDate;
        if (paidAmount !== undefined) invoice.paidAmount = Number(paidAmount);

        await invoice.save();
        const populated = await Billing.findById(invoice._id)
            .populate('patient', 'firstName lastName email phone')
            .populate('prescription');
        res.status(200).json({ status: 'success', data: { invoice: populated } });
    } catch (error) {
        next(error);
    }
};

exports.deletePrescriptionBill = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'prescription') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        if (req.user?.role === 'dentist' && req.user?._id && invoice.prescription) {
            const p = await Prescription.findById(invoice.prescription).select('dentist');
            if (!p || String(p.dentist) !== String(req.user._id)) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        if (invoice.prescription) {
            await Prescription.updateOne({ _id: invoice.prescription }, { $set: { invoice: null } });
        }
        await Billing.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

exports.getPrescriptionReceipt = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id)
            .populate('patient', 'firstName lastName email phone')
            .populate('prescription');

        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'prescription') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        if (req.user?.role === 'dentist' && req.user?._id && invoice.prescription) {
            const p = await Prescription.findById(invoice.prescription).select('dentist');
            if (!p || String(p.dentist) !== String(req.user._id)) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        res.status(200).json({ status: 'success', data: { receipt: buildReceipt(invoice) } });
    } catch (error) {
        next(error);
    }
};

// Get prescription billing stats
exports.getPrescriptionBillingStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const matchQuery = { invoiceType: 'prescription' };

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
                    avgPrescriptionCost: { $avg: '$total' }
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
                    avgPrescriptionCost: 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

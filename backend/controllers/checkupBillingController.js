const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');
const User = require('../models/User');

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

exports.updateCheckupBill = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id).populate('patient', 'firstName lastName email phone').populate('appointment');
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'checkup') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        if (req.user?.role === 'dentist' && req.user?._id && invoice.appointment) {
            const appt = await Appointment.findById(invoice.appointment).select('dentist');
            if (!appt || String(appt.dentist) !== String(req.user._id)) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        const { checkupFee, notes, dueDate, paidAmount } = req.body || {};
        if (checkupFee !== undefined) {
            const fee = Number(checkupFee);
            const desc = invoice.items?.[0]?.description || 'Checkup';
            invoice.items = [{ description: desc, quantity: 1, unitPrice: fee }];
        }
        if (notes !== undefined) invoice.notes = notes;
        if (dueDate !== undefined) invoice.dueDate = dueDate;
        if (paidAmount !== undefined) invoice.paidAmount = Number(paidAmount);

        await invoice.save();
        const populated = await Billing.findById(invoice._id).populate('patient', 'firstName lastName email phone').populate('appointment');
        res.status(200).json({ status: 'success', data: { invoice: populated } });
    } catch (error) {
        next(error);
    }
};

exports.deleteCheckupBill = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id);
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'checkup') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        if (req.user?.role === 'dentist' && req.user?._id && invoice.appointment) {
            const appt = await Appointment.findById(invoice.appointment).select('dentist');
            if (!appt || String(appt.dentist) !== String(req.user._id)) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        if (invoice.appointment) {
            await Appointment.updateOne({ _id: invoice.appointment }, { $set: { invoice: null } });
        }
        await Billing.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

exports.getCheckupReceipt = async (req, res, next) => {
    try {
        const invoice = await Billing.findById(req.params.id)
            .populate('patient', 'firstName lastName email phone')
            .populate('appointment');

        if (!invoice) return res.status(404).json({ status: 'error', message: 'Not found' });
        if (String(invoice.invoiceType) !== 'checkup') {
            return res.status(400).json({ status: 'error', message: 'Invalid invoice type' });
        }

        if (req.user?.role === 'dentist' && req.user?._id && invoice.appointment) {
            const appt = await Appointment.findById(invoice.appointment).select('dentist');
            if (!appt || String(appt.dentist) !== String(req.user._id)) {
                return res.status(404).json({ status: 'error', message: 'Not found' });
            }
        }

        res.status(200).json({ status: 'success', data: { receipt: buildReceipt(invoice) } });
    } catch (error) {
        next(error);
    }
};

// Get appointments ready for billing (before completion too)
exports.getAppointmentsForBilling = async (req, res, next) => {
    try {
        const { patientId, dentistId, startDate, endDate, status } = req.query;

        const allowedStatuses = ['scheduled', 'confirmed', 'in_progress', 'in-progress', 'completed'];
        const resolvedStatus = status ? String(status) : null;

        const query = {
            status: resolvedStatus ? resolvedStatus : { $in: allowedStatuses },
            isPaid: false,
            invoice: { $eq: null }
        };

        if (patientId) query.patient = patientId;
        if (dentistId) query.dentist = dentistId;

        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        if (startDate || endDate) {
            query.appointmentDate = {};
            if (startDate) query.appointmentDate.$gte = new Date(startDate);
            if (endDate) query.appointmentDate.$lte = new Date(endDate);
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName email phone')
            .populate('dentist', 'firstName lastName email checkupFee')
            .sort('-appointmentDate');

        res.status(200).json({
            status: 'success',
            data: { appointments }
        });
    } catch (error) {
        next(error);
    }
};

// Create checkup invoice from appointment
exports.createCheckupBill = async (req, res, next) => {
    try {
        const { appointmentId, checkupFee, notes, dueDate, paidAmount = 0 } = req.body;

        const appointment = await Appointment.findById(appointmentId)
            .populate('patient', 'firstName lastName')
            .populate('dentist', 'firstName lastName checkupFee');

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        if (req.user?.role === 'dentist' && req.user?._id && String(appointment.dentist?._id) !== String(req.user._id)) {
            return res.status(404).json({ status: 'error', message: 'Appointment not found' });
        }

        if (appointment.isPaid || appointment.invoice) {
            return res.status(400).json({
                status: 'error',
                message: 'Appointment already billed'
            });
        }

        // Use provided fee or dentist's default fee
        const fee = checkupFee || appointment.dentist?.checkupFee || appointment.checkupFee || 0;

        if (fee <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Checkup fee must be greater than 0'
            });
        }

        // Create invoice
        const invoiceData = {
            patient: appointment.patient._id,
            patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            invoiceType: 'checkup',
            appointment: appointment._id,
            items: [{
                description: `Checkup - Dr. ${appointment.dentist.firstName} ${appointment.dentist.lastName}`,
                quantity: 1,
                unitPrice: fee
            }],
            dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            notes: notes || `Checkup fee for appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()}`,
            paidAmount,
            billingContext: {
                appointmentDate: appointment.appointmentDate,
                appointmentType: appointment.type,
                dentist: {
                    id: appointment.dentist._id,
                    name: `${appointment.dentist.firstName} ${appointment.dentist.lastName}`
                }
            }
        };

        const invoice = await Billing.create(invoiceData);

        // Update appointment
        appointment.invoice = invoice._id;
        appointment.checkupFee = fee;
        await appointment.save();

        const populated = await Billing.findById(invoice._id)
            .populate('patient', 'firstName lastName email phone')
            .populate('appointment');

        res.status(201).json({
            status: 'success',
            data: { invoice: populated }
        });
    } catch (error) {
        next(error);
    }
};

// Get checkup billing stats
exports.getCheckupBillingStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const matchQuery = { invoiceType: 'checkup' };

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
                    avgCheckupFee: { $avg: '$total' }
                }
            }
        ]);

        // Count by status
        const statusCounts = await Billing.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
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
                    avgCheckupFee: 0
                },
                statusBreakdown: statusCounts
            }
        });
    } catch (error) {
        next(error);
    }
};

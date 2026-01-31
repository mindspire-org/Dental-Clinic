const WaitingList = require('../models/WaitingList');
const Patient = require('../models/Patient');

exports.getWaitingList = async (req, res, next) => {
    try {
        const { status, priority } = req.query;
        const query = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;

        const waitingList = await WaitingList.find(query)
            .populate('patient', 'firstName lastName phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: { waitingList },
        });
    } catch (error) {
        next(error);
    }
};

exports.createWaitingItem = async (req, res, next) => {
    try {
        const { patientId, priority, reason, contact } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ status: 'error', message: 'Patient not found' });
        }

        const item = await WaitingList.create({
            patient: patient._id,
            priority,
            reason,
            contact: typeof contact === 'string' && contact.trim() ? contact.trim() : patient.phone,
            status: 'Waiting',
        });

        const populated = await WaitingList.findById(item._id).populate('patient', 'firstName lastName phone');

        res.status(201).json({
            status: 'success',
            data: { item: populated },
        });
    } catch (error) {
        next(error);
    }
};

exports.updateWaitingItem = async (req, res, next) => {
    try {
        const { priority, reason, contact, status } = req.body;

        const item = await WaitingList.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ status: 'error', message: 'Waiting list item not found' });
        }

        if (typeof priority !== 'undefined') item.priority = priority;
        if (typeof reason !== 'undefined') item.reason = reason;
        if (typeof contact !== 'undefined') item.contact = contact;
        if (typeof status !== 'undefined') item.status = status;

        await item.save();

        const populated = await WaitingList.findById(item._id).populate('patient', 'firstName lastName phone');

        res.status(200).json({
            status: 'success',
            data: { item: populated },
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteWaitingItem = async (req, res, next) => {
    try {
        const item = await WaitingList.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ status: 'error', message: 'Waiting list item not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Waiting list item deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

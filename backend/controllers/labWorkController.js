const LabWork = require('../models/LabWork');

exports.getLabWorkSummary = async (req, res, next) => {
    try {
        const openStatuses = ['requested', 'in-progress'];
        const query = { status: { $in: openStatuses } };

        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const openCount = await LabWork.countDocuments(query);
        res.status(200).json({ status: 'success', data: { openCount } });
    } catch (error) {
        next(error);
    }
};

exports.getAllLabWork = async (req, res, next) => {
    try {
        const { status, patientId, dentistId, search, limit = 100 } = req.query;
        const query = {};

        if (status) query.status = String(status);
        if (patientId) query.patient = patientId;
        if (dentistId) query.dentist = dentistId;

        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }
        if (search) {
            const q = String(search).trim();
            query.$or = [
                { labName: { $regex: q, $options: 'i' } },
                { workType: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { notes: { $regex: q, $options: 'i' } },
                { trackingNumber: { $regex: q, $options: 'i' } },
            ];
        }

        const labWorks = await LabWork.find(query)
            .populate('patient')
            .populate('dentist')
            .populate('treatment')
            .sort({ requestDate: -1, createdAt: -1 })
            .limit(Math.min(parseInt(limit, 10) || 100, 200));
        res.status(200).json({ status: 'success', data: { labWorks } });
    } catch (error) { next(error); }
};

exports.getLabWorkById = async (req, res, next) => {
    try {
        const labWork = await LabWork.findById(req.params.id)
            .populate('patient')
            .populate('dentist')
            .populate('treatment');
        if (!labWork) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { labWork } });
    } catch (error) { next(error); }
};

exports.createLabWork = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        if (!payload.dentist && req.user?._id) {
            payload.dentist = req.user._id;
        }
        const labWork = await LabWork.create(payload);
        res.status(201).json({ status: 'success', data: { labWork } });
    } catch (error) { next(error); }
};

exports.updateLabWork = async (req, res, next) => {
    try {
        const labWork = await LabWork.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('patient')
            .populate('dentist')
            .populate('treatment');
        res.status(200).json({ status: 'success', data: { labWork } });
    } catch (error) { next(error); }
};

exports.deleteLabWork = async (req, res, next) => {
    try {
        await LabWork.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

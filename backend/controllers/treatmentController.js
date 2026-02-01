const Treatment = require('../models/Treatment');

exports.getAllTreatments = async (req, res, next) => {
    try {
        const { status, patientId, dentistId, search, limit = 50 } = req.query;
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
                { treatmentType: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { notes: { $regex: q, $options: 'i' } },
            ];
        }

        const treatments = await Treatment.find(query)
            .populate('patient')
            .populate('dentist')
            .populate('procedure')
            .sort({ startDate: -1, createdAt: -1 })
            .limit(Math.min(parseInt(limit, 10) || 50, 200));
        res.status(200).json({ status: 'success', data: { treatments } });
    } catch (error) { next(error); }
};

exports.getTreatmentById = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const treatment = await Treatment.findOne(query)
            .populate('patient')
            .populate('dentist')
            .populate('procedure');
        if (!treatment) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { treatment } });
    } catch (error) { next(error); }
};

exports.createTreatment = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        if (!payload.dentist && req.user?.role === 'dentist' && req.user?._id) {
            payload.dentist = req.user._id;
        }
        const treatment = await Treatment.create(payload);
        res.status(201).json({ status: 'success', data: { treatment } });
    } catch (error) { next(error); }
};

exports.updateTreatment = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const treatment = await Treatment.findOneAndUpdate(
            query,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json({ status: 'success', data: { treatment } });
    } catch (error) { next(error); }
};

exports.deleteTreatment = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }
        await Treatment.findOneAndDelete(query);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

exports.getPatientTreatments = async (req, res, next) => {
    try {
        const query = { patient: req.params.patientId };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const treatments = await Treatment.find(query)
            .populate('patient')
            .populate('dentist')
            .populate('procedure')
            .sort({ startDate: -1, createdAt: -1 });
        res.status(200).json({ status: 'success', data: { treatments } });
    } catch (error) { next(error); }
};

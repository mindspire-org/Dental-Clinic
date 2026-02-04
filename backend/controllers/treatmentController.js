const Treatment = require('../models/Treatment');

const applySessionProgress = (treatment) => {
    const planned = Math.max(1, Math.round(Number(treatment.plannedSessions || 1)));
    const done = Array.isArray(treatment.sessions) ? treatment.sessions.length : 0;

    if (done > 0 && treatment.status === 'planned') {
        treatment.status = 'in-progress';
    }

    const progressFromSessions = Math.max(0, Math.min(100, Math.round((done / planned) * 100)));
    if (typeof treatment.progressPercent !== 'number' || treatment.progressPercent < progressFromSessions) {
        treatment.progressPercent = progressFromSessions;
    }

    if (done >= planned) {
        treatment.status = 'completed';
        treatment.completionDate = new Date();
        treatment.progressPercent = 100;
    }
};

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

exports.addTreatmentSession = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const treatment = await Treatment.findOne(query);
        if (!treatment) return res.status(404).json({ status: 'error', message: 'Not found' });

        const body = req.body || {};
        const sessionDate = body.date ? new Date(body.date) : new Date();
        const session = {
            date: sessionDate,
            duration: body.duration !== undefined ? Number(body.duration) : undefined,
            notes: body.notes !== undefined ? String(body.notes) : undefined,
            performedBy: req.user?._id || req.user?.id || undefined,
        };

        treatment.sessions = Array.isArray(treatment.sessions) ? treatment.sessions : [];
        treatment.sessions.push(session);

        applySessionProgress(treatment);

        await treatment.save();

        const populated = await Treatment.findById(treatment._id)
            .populate('patient')
            .populate('dentist')
            .populate('procedure')
            .populate('invoice');

        res.status(200).json({ status: 'success', data: { treatment: populated } });
    } catch (error) { next(error); }
};

exports.updateTreatmentSession = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const treatment = await Treatment.findOne(query);
        if (!treatment) return res.status(404).json({ status: 'error', message: 'Not found' });

        const sessions = Array.isArray(treatment.sessions) ? treatment.sessions : [];
        const session = sessions.id(req.params.sessionId);
        if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

        const body = req.body || {};
        if (body.date !== undefined) session.date = body.date ? new Date(body.date) : session.date;
        if (body.duration !== undefined) session.duration = body.duration === null ? undefined : Number(body.duration);
        if (body.notes !== undefined) session.notes = body.notes === null ? undefined : String(body.notes);
        if (!session.performedBy) session.performedBy = req.user?._id || req.user?.id || session.performedBy;

        applySessionProgress(treatment);
        await treatment.save();

        const populated = await Treatment.findById(treatment._id)
            .populate('patient')
            .populate('dentist')
            .populate('procedure')
            .populate('invoice');

        res.status(200).json({ status: 'success', data: { treatment: populated } });
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

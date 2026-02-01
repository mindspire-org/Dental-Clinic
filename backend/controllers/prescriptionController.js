const Prescription = require('../models/Prescription');

exports.getAllPrescriptions = async (req, res, next) => {
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
                { prescriptionNumber: { $regex: q, $options: 'i' } },
                { instructions: { $regex: q, $options: 'i' } },
                { 'medications.name': { $regex: q, $options: 'i' } },
            ];
        }

        const prescriptions = await Prescription.find(query)
            .populate('patient')
            .populate('dentist')
            .sort({ prescriptionDate: -1, createdAt: -1 })
            .limit(Math.min(parseInt(limit, 10) || 100, 200));
        res.status(200).json({ status: 'success', data: { prescriptions } });
    } catch (error) { next(error); }
};

exports.getPrescriptionById = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const prescription = await Prescription.findOne(query)
            .populate('patient')
            .populate('dentist')
            .populate('treatment');
        if (!prescription) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { prescription } });
    } catch (error) { next(error); }
};

exports.createPrescription = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        if (!payload.dentist && req.user?.role === 'dentist' && req.user?._id) {
            payload.dentist = req.user._id;
        }
        const prescription = await Prescription.create(payload);
        res.status(201).json({ status: 'success', data: { prescription } });
    } catch (error) { next(error); }
};

exports.updatePrescription = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const prescription = await Prescription.findOneAndUpdate(
            query,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('patient')
            .populate('dentist')
            .populate('treatment');
        res.status(200).json({ status: 'success', data: { prescription } });
    } catch (error) { next(error); }
};

exports.deletePrescription = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }
        await Prescription.findOneAndDelete(query);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

exports.getPatientPrescriptions = async (req, res, next) => {
    try {
        const query = { patient: req.params.patientId };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const prescriptions = await Prescription.find(query)
            .populate('patient')
            .populate('dentist')
            .sort({ prescriptionDate: -1, createdAt: -1 });
        res.status(200).json({ status: 'success', data: { prescriptions } });
    } catch (error) { next(error); }
};

const Treatment = require('../models/Treatment');

exports.getAllTreatments = async (req, res, next) => {
    try {
        const treatments = await Treatment.find().populate('patient').populate('dentist').limit(50);
        res.status(200).json({ status: 'success', data: { treatments } });
    } catch (error) { next(error); }
};

exports.getTreatmentById = async (req, res, next) => {
    try {
        const treatment = await Treatment.findById(req.params.id).populate('patient');
        if (!treatment) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { treatment } });
    } catch (error) { next(error); }
};

exports.createTreatment = async (req, res, next) => {
    try {
        const treatment = await Treatment.create(req.body);
        res.status(201).json({ status: 'success', data: { treatment } });
    } catch (error) { next(error); }
};

exports.updateTreatment = async (req, res, next) => {
    try {
        const treatment = await Treatment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: 'success', data: { treatment } });
    } catch (error) { next(error); }
};

exports.deleteTreatment = async (req, res, next) => {
    try {
        await Treatment.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

exports.getPatientTreatments = async (req, res, next) => {
    try {
        const treatments = await Treatment.find({ patient: req.params.patientId });
        res.status(200).json({ status: 'success', data: { treatments } });
    } catch (error) { next(error); }
};

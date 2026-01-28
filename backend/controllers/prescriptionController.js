const Prescription = require('../models/Prescription');

exports.getAllPrescriptions = async (req, res, next) => {
    try {
        const prescriptions = await Prescription.find().populate('patient').sort('-createdAt');
        res.status(200).json({ status: 'success', data: { prescriptions } });
    } catch (error) { next(error); }
};

exports.getPrescriptionById = async (req, res, next) => {
    try {
        const prescription = await Prescription.findById(req.params.id).populate('patient');
        if (!prescription) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { prescription } });
    } catch (error) { next(error); }
};

exports.createPrescription = async (req, res, next) => {
    try {
        const prescription = await Prescription.create(req.body);
        res.status(201).json({ status: 'success', data: { prescription } });
    } catch (error) { next(error); }
};

exports.updatePrescription = async (req, res, next) => {
    try {
        const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: 'success', data: { prescription } });
    } catch (error) { next(error); }
};

exports.deletePrescription = async (req, res, next) => {
    try {
        await Prescription.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

exports.getPatientPrescriptions = async (req, res, next) => {
    try {
        const prescriptions = await Prescription.find({ patient: req.params.patientId });
        res.status(200).json({ status: 'success', data: { prescriptions } });
    } catch (error) { next(error); }
};

const LabWork = require('../models/LabWork');

exports.getAllLabWork = async (req, res, next) => {
    try {
        const labWorks = await LabWork.find().populate('patient').sort('-requestDate');
        res.status(200).json({ status: 'success', data: { labWorks } });
    } catch (error) { next(error); }
};

exports.getLabWorkById = async (req, res, next) => {
    try {
        const labWork = await LabWork.findById(req.params.id).populate('patient');
        if (!labWork) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { labWork } });
    } catch (error) { next(error); }
};

exports.createLabWork = async (req, res, next) => {
    try {
        const labWork = await LabWork.create(req.body);
        res.status(201).json({ status: 'success', data: { labWork } });
    } catch (error) { next(error); }
};

exports.updateLabWork = async (req, res, next) => {
    try {
        const labWork = await LabWork.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: 'success', data: { labWork } });
    } catch (error) { next(error); }
};

exports.deleteLabWork = async (req, res, next) => {
    try {
        await LabWork.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

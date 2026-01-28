const Document = require('../models/Document');

exports.getAllDocuments = async (req, res, next) => {
    try {
        const documents = await Document.find().populate('uploadedBy', 'firstName lastName').sort('-uploadDate');
        res.status(200).json({ status: 'success', data: { documents } });
    } catch (error) { next(error); }
};

exports.getDocumentById = async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { document } });
    } catch (error) { next(error); }
};

exports.uploadDocument = async (req, res, next) => {
    // Logic usually involves middleware placing file info in req.file
    try {
        // This would be actual implementation with upload middleware
        res.status(201).json({ status: 'success', message: 'File uploaded' });
    } catch (error) { next(error); }
};

exports.deleteDocument = async (req, res, next) => {
    try {
        await Document.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

exports.getPatientDocuments = async (req, res, next) => {
    try {
        const documents = await Document.find({ patient: req.params.patientId });
        res.status(200).json({ status: 'success', data: { documents } });
    } catch (error) { next(error); }
};

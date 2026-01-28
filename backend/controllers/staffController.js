const Staff = require('../models/Staff');

exports.getAllStaff = async (req, res, next) => {
    try {
        const staff = await Staff.find().populate('user', 'firstName lastName email phone').sort('createdAt');
        res.status(200).json({ status: 'success', data: { staff } });
    } catch (error) { next(error); }
};

exports.getStaffById = async (req, res, next) => {
    try {
        const staffMember = await Staff.findById(req.params.id).populate('user');
        if (!staffMember) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { staffMember } });
    } catch (error) { next(error); }
};

exports.createStaff = async (req, res, next) => {
    try {
        const staffMember = await Staff.create(req.body);
        res.status(201).json({ status: 'success', data: { staffMember } });
    } catch (error) { next(error); }
};

exports.updateStaff = async (req, res, next) => {
    try {
        const staffMember = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: 'success', data: { staffMember } });
    } catch (error) { next(error); }
};

exports.deleteStaff = async (req, res, next) => {
    try {
        await Staff.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

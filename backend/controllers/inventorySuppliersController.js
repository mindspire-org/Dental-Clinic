const Supplier = require('../models/Supplier');

exports.getAllSuppliers = async (req, res, next) => {
    try {
        const { search, isActive } = req.query;
        const query = {};

        if (typeof isActive !== 'undefined') {
            query.isActive = String(isActive) === 'true';
        }

        if (search) {
            const q = String(search).trim();
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { contactPerson: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } },
            ];
        }

        const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: { suppliers } });
    } catch (error) {
        next(error);
    }
};

exports.getSupplierById = async (req, res, next) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { supplier } });
    } catch (error) {
        next(error);
    }
};

exports.createSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.create(req.body || {});
        res.status(201).json({ status: 'success', data: { supplier } });
    } catch (error) {
        next(error);
    }
};

exports.updateSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body || {}, {
            new: true,
            runValidators: true,
        });
        if (!supplier) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { supplier } });
    } catch (error) {
        next(error);
    }
};

exports.deleteSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

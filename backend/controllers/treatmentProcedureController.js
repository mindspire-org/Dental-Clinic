const TreatmentProcedure = require('../models/TreatmentProcedure');

exports.getAllTreatmentProcedures = async (req, res, next) => {
    try {
        const { isActive, category, search } = req.query;
        const query = {};

        if (typeof isActive !== 'undefined') {
            query.isActive = String(isActive) === 'true';
        }

        if (category) {
            query.category = String(category).trim();
        }

        if (search) {
            const q = String(search).trim();
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
            ];
        }

        const procedures = await TreatmentProcedure.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: { procedures },
        });
    } catch (error) {
        next(error);
    }
};

exports.getTreatmentProcedureById = async (req, res, next) => {
    try {
        const procedure = await TreatmentProcedure.findById(req.params.id);
        if (!procedure) {
            return res.status(404).json({ status: 'error', message: 'Not found' });
        }
        res.status(200).json({ status: 'success', data: { procedure } });
    } catch (error) {
        next(error);
    }
};

exports.createTreatmentProcedure = async (req, res, next) => {
    try {
        const procedure = await TreatmentProcedure.create(req.body);
        res.status(201).json({ status: 'success', data: { procedure } });
    } catch (error) {
        next(error);
    }
};

exports.updateTreatmentProcedure = async (req, res, next) => {
    try {
        const procedure = await TreatmentProcedure.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!procedure) {
            return res.status(404).json({ status: 'error', message: 'Not found' });
        }

        res.status(200).json({ status: 'success', data: { procedure } });
    } catch (error) {
        next(error);
    }
};

exports.deleteTreatmentProcedure = async (req, res, next) => {
    try {
        const procedure = await TreatmentProcedure.findByIdAndDelete(req.params.id);
        if (!procedure) {
            return res.status(404).json({ status: 'error', message: 'Not found' });
        }

        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

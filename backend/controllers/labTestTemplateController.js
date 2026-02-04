const LabTestTemplate = require('../models/LabTestTemplate');

exports.getAllTemplates = async (req, res, next) => {
    try {
        const { search, isActive } = req.query;
        const query = {};

        if (typeof isActive !== 'undefined') {
            query.isActive = String(isActive) === 'true';
        }

        if (search) {
            const q = String(search).trim();
            if (q) {
                query.$or = [
                    { name: { $regex: q, $options: 'i' } },
                    { labName: { $regex: q, $options: 'i' } },
                    { workType: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                ];
            }
        }

        const templates = await LabTestTemplate.find(query).sort({ name: 1, createdAt: -1 });
        res.status(200).json({ status: 'success', data: { templates } });
    } catch (e) {
        next(e);
    }
};

exports.getTemplateById = async (req, res, next) => {
    try {
        const template = await LabTestTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { template } });
    } catch (e) {
        next(e);
    }
};

exports.createTemplate = async (req, res, next) => {
    try {
        const payload = req.body || {};
        const name = String(payload.name || '').trim();
        if (!name) return res.status(400).json({ status: 'error', message: 'Name is required' });

        const template = await LabTestTemplate.create({
            name,
            labName: String(payload.labName || '').trim(),
            workType: payload.workType,
            description: String(payload.description || '').trim(),
            defaultCost: typeof payload.defaultCost !== 'undefined' ? Number(payload.defaultCost) : undefined,
            isActive: typeof payload.isActive !== 'undefined' ? Boolean(payload.isActive) : true,
        });

        res.status(201).json({ status: 'success', data: { template } });
    } catch (e) {
        next(e);
    }
};

exports.updateTemplate = async (req, res, next) => {
    try {
        const body = req.body || {};
        if (body.name !== undefined) body.name = String(body.name || '').trim();
        if (body.labName !== undefined) body.labName = String(body.labName || '').trim();
        if (body.description !== undefined) body.description = String(body.description || '').trim();
        if (body.defaultCost !== undefined) body.defaultCost = Number(body.defaultCost);

        const template = await LabTestTemplate.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
        if (!template) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { template } });
    } catch (e) {
        next(e);
    }
};

exports.deleteTemplate = async (req, res, next) => {
    try {
        const deleted = await LabTestTemplate.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (e) {
        next(e);
    }
};

const Document = require('../models/Document');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

const normalizeCategory = (category) => {
    const c = String(category || '').trim().toLowerCase();
    if (!c) return 'other';
    if (c === 'general') return 'other';
    if (c === 'xray') return 'x-ray';
    if (c === 'x-ray') return 'x-ray';
    if (c === 'x-rays') return 'x-ray';
    if (c === 'consent') return 'consent-form';
    if (c === 'consent-form') return 'consent-form';
    if (c === 'consent-forms') return 'consent-form';
    if (c === 'medical_history') return 'medical-history';
    if (c === 'medical-history') return 'medical-history';
    if (c === 'treatment-plan') return 'treatment-plan';
    if (c === 'treatment-plans') return 'treatment-plan';
    if (c === 'lab-report') return 'lab-report';
    if (c === 'lab-reports') return 'lab-report';
    return c;
};

const parseTags = (tags) => {
    if (!tags) return [];
    if (typeof tags === 'string') {
        return tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
    }
    if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
    return [];
};

const pickUploaderId = async (req, uploadedBy) => {
    let uploaderId = req.user?.id || req.user?._id || uploadedBy;
    if (!uploaderId) {
        const admin = await User.findOne({ role: 'admin' }).select('_id');
        const anyUser = admin || (await User.findOne({}).select('_id'));
        uploaderId = anyUser?._id;
    }
    return uploaderId;
};

const getBaseUrl = (req) => {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}`;
};

const toDto = (doc, req) => {
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
    const base = getBaseUrl(req);
    const fileName = obj.fileName || (obj.filePath ? path.basename(obj.filePath) : undefined);
    const fileUrl = (!obj.isFolder && fileName) ? `${base}/uploads/${encodeURIComponent(fileName)}` : '';

    return {
        ...obj,
        fileUrl,
    };
};

exports.getAllDocuments = async (req, res, next) => {
    try {
        const { category, search, patientId, parentId, isFolder, includeArchived } = req.query;

        const query = {};
        if (includeArchived !== 'true') query.isArchived = { $ne: true };
        if (category && String(category).toLowerCase() !== 'all' && String(category).toLowerCase() !== 'all-files') {
            query.category = normalizeCategory(category);
        }
        if (patientId) query.patient = patientId;
        if (parentId === 'null' || parentId === '') query.parent = null;
        else if (parentId) query.parent = parentId;

        if (isFolder !== undefined) {
            const v = String(isFolder).toLowerCase();
            query.isFolder = v === 'true' || v === '1';
        }

        if (search) {
            const q = String(search).trim();
            if (q) {
                query.$or = [
                    { title: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { tags: { $regex: q, $options: 'i' } },
                ];
            }
        }

        const documents = await Document.find(query)
            .populate('patient', 'firstName lastName phone')
            .populate('uploadedBy', 'firstName lastName')
            .sort({ isFolder: -1, uploadDate: -1 });

        res.status(200).json({
            status: 'success',
            data: { documents: documents.map((d) => toDto(d, req)) },
        });
    } catch (error) { next(error); }
};

exports.createFolder = async (req, res, next) => {
    try {
        const { title, description, category, patientId, treatmentId, parentId, tags, uploadedBy } = req.body || {};
        const safeTitle = String(title || '').trim();
        if (!safeTitle) {
            return res.status(400).json({ status: 'error', message: 'title is required' });
        }

        const uploaderId = await pickUploaderId(req, uploadedBy);
        if (!uploaderId) {
            return res.status(400).json({ status: 'error', message: 'Uploader is required' });
        }

        const folder = await Document.create({
            isFolder: true,
            parent: parentId || null,
            patient: patientId || undefined,
            treatment: treatmentId || undefined,
            uploadedBy: uploaderId,
            title: safeTitle,
            description: description || '',
            category: normalizeCategory(category),
            tags: parseTags(tags),
            uploadDate: new Date(),
        });

        const populated = await Document.findById(folder._id)
            .populate('patient', 'firstName lastName phone')
            .populate('uploadedBy', 'firstName lastName');

        res.status(201).json({ status: 'success', data: { folder: toDto(populated, req) } });
    } catch (error) {
        next(error);
    }
};

exports.updateDocument = async (req, res, next) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ status: 'error', message: 'Not found' });

        const body = req.body || {};
        if (body.title !== undefined) {
            const t = String(body.title || '').trim();
            if (t) doc.title = t;
        }
        if (body.description !== undefined) doc.description = body.description;
        if (body.category !== undefined) doc.category = normalizeCategory(body.category);
        if (body.tags !== undefined) doc.tags = parseTags(body.tags);
        if (body.isArchived !== undefined) doc.isArchived = Boolean(body.isArchived);
        if (body.parentId !== undefined) doc.parent = body.parentId || null;

        await doc.save();

        const populated = await Document.findById(doc._id)
            .populate('patient', 'firstName lastName phone')
            .populate('uploadedBy', 'firstName lastName');

        res.status(200).json({ status: 'success', data: { document: toDto(populated, req) } });
    } catch (error) {
        next(error);
    }
};

exports.getDocumentById = async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('patient', 'firstName lastName phone')
            .populate('uploadedBy', 'firstName lastName');
        if (!document) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { document: toDto(document, req) } });
    } catch (error) { next(error); }
};

exports.uploadDocument = async (req, res, next) => {
    // Logic usually involves middleware placing file info in req.file
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ status: 'error', message: 'No file uploaded' });
        }

        const {
            title,
            description,
            category,
            patientId,
            treatmentId,
            parentId,
            tags,
            uploadedBy,
        } = req.body;

        const uploaderId = await pickUploaderId(req, uploadedBy);

        if (!uploaderId) {
            return res.status(400).json({ status: 'error', message: 'Uploader is required' });
        }

        const parsedTags = parseTags(tags);

        const doc = await Document.create({
            patient: patientId || undefined,
            treatment: treatmentId || undefined,
            parent: parentId || null,
            uploadedBy: uploaderId,
            title: title || file.originalname,
            description: description || '',
            category: normalizeCategory(category),
            fileName: file.filename,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            tags: parsedTags,
            uploadDate: new Date(),
        });

        const populated = await Document.findById(doc._id)
            .populate('patient', 'firstName lastName phone')
            .populate('uploadedBy', 'firstName lastName');

        res.status(201).json({ status: 'success', data: { document: toDto(populated, req) } });
    } catch (error) { next(error); }
};

exports.deleteDocument = async (req, res, next) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ status: 'error', message: 'Not found' });

        const idsToDelete = [doc._id];
        if (doc.isFolder) {
            const queue = [doc._id];
            while (queue.length) {
                const current = queue.shift();
                const children = await Document.find({ parent: current }).select('_id isFolder filePath');
                for (const c of children) {
                    idsToDelete.push(c._id);
                    if (c.isFolder) queue.push(c._id);
                }
            }
        }

        const docs = await Document.find({ _id: { $in: idsToDelete } }).select('filePath isFolder');
        for (const d of docs) {
            if (d?.filePath) {
                try {
                    fs.unlinkSync(d.filePath);
                } catch {
                    // ignore
                }
            }
        }

        await Document.deleteMany({ _id: { $in: idsToDelete } });
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

exports.getPatientDocuments = async (req, res, next) => {
    try {
        const documents = await Document.find({ patient: req.params.patientId })
            .populate('patient', 'firstName lastName phone')
            .populate('uploadedBy', 'firstName lastName')
            .sort('-uploadDate');

        res.status(200).json({
            status: 'success',
            data: { documents: documents.map((d) => toDto(d, req)) },
        });
    } catch (error) { next(error); }
};

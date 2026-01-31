const User = require('../models/User');
const License = require('../models/License');
const { MODULE_KEYS, getOrCreateLicense } = require('../middleware/permissions.middleware');
const { persistLicenseKey } = require('../config/licenseKey');

exports.getAvailableModules = async (req, res, next) => {
    try {
        res.status(200).json({
            status: 'success',
            data: {
                modules: MODULE_KEYS,
            },
        });
    } catch (e) {
        next(e);
    }
};

exports.setLicenseKey = async (req, res, next) => {
    try {
        const { licenseKey } = req.body || {};
        if (!licenseKey || typeof licenseKey !== 'string' || !licenseKey.trim()) {
            return res.status(400).json({ status: 'error', message: 'licenseKey is required' });
        }

        const lic = await getOrCreateLicense();
        lic.licenseKey = licenseKey.trim();
        await lic.save();
        persistLicenseKey(lic.licenseKey);

        res.status(200).json({ status: 'success', data: { license: lic } });
    } catch (e) {
        next(e);
    }
};

exports.getLicense = async (req, res, next) => {
    try {
        const lic = await getOrCreateLicense();
        res.status(200).json({ status: 'success', data: { license: lic } });
    } catch (e) {
        next(e);
    }
};

exports.activateLicense = async (req, res, next) => {
    try {
        const { enabledModules } = req.body || {};
        const lic = await getOrCreateLicense();

        lic.isActive = true;
        lic.activatedAt = new Date();
        lic.activatedBy = req.user.id;
        if (Array.isArray(enabledModules) && enabledModules.length) {
            lic.enabledModules = enabledModules;
        }
        await lic.save();

        res.status(200).json({ status: 'success', data: { license: lic } });
    } catch (e) {
        next(e);
    }
};

exports.listAdminUsers = async (req, res, next) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('firstName lastName email username permissions isActive');
        res.status(200).json({ status: 'success', data: { admins } });
    } catch (e) {
        next(e);
    }
};

exports.setAdminPermissions = async (req, res, next) => {
    try {
        const { adminId } = req.params;
        const { permissions } = req.body || {};

        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).json({ status: 'error', message: 'Admin user not found' });
        }
        if (admin.role !== 'admin') {
            return res.status(400).json({ status: 'error', message: 'Target user is not an admin' });
        }

        admin.permissions = Array.isArray(permissions) ? permissions : [];
        await admin.save();

        res.status(200).json({ status: 'success', data: { admin } });
    } catch (e) {
        next(e);
    }
};

exports.setAllAdminPermissions = async (req, res, next) => {
    try {
        const { permissions } = req.body || {};
        const nextPerms = Array.isArray(permissions) ? permissions : [];

        const result = await User.updateMany(
            { role: 'admin' },
            { $set: { permissions: nextPerms } }
        );

        res.status(200).json({ status: 'success', data: { modifiedCount: result.modifiedCount ?? result.nModified ?? 0 } });
    } catch (e) {
        next(e);
    }
};

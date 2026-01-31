const License = require('../models/License');
const { ensureLicenseKey } = require('../config/licenseKey');

const MODULE_KEYS = [
    'dashboard',
    'patients',
    'appointments',
    'dental-chart',
    'treatments',
    'prescriptions',
    'lab-work',
    'billing',
    'inventory',
    'staff',
    'dentists',
    'reports',
    'documents',
    'settings',
];

const getOrCreateLicense = async () => {
    let lic = await License.findOne();
    if (!lic) {
        lic = await License.create({ licenseKey: ensureLicenseKey(), enabledModules: MODULE_KEYS });
    }

    if (!lic.licenseKey) {
        lic.licenseKey = ensureLicenseKey();
        await lic.save();
    }
    return lic;
};

const requireLicenseActive = async (req, res, next) => {
    try {
        if (req.user?.role === 'superadmin') return next();

        const lic = await getOrCreateLicense();
        if (!lic.isActive) {
            return res.status(403).json({
                status: 'error',
                message: 'License is not active. Please contact the software provider.',
            });
        }

        req.license = lic;
        next();
    } catch (e) {
        next(e);
    }
};

const requireModuleAccess = (moduleKey) => {
    return async (req, res, next) => {
        try {
            if (req.user?.role === 'superadmin') return next();

            const lic = req.license || await getOrCreateLicense();
            if (lic.enabledModules?.length && !lic.enabledModules.includes(moduleKey)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Module is not enabled in license',
                });
            }

            if (req.user?.role !== 'admin') return next();

            const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
            if (!perms.includes(moduleKey)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'You do not have permission to access this module',
                });
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};

module.exports = {
    MODULE_KEYS,
    requireLicenseActive,
    requireModuleAccess,
    getOrCreateLicense,
};

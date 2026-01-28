const Setting = require('../models/Setting');

// Get all settings
exports.getAllSettings = async (req, res, next) => {
    try {
        const settings = await Setting.find().populate('updatedBy', 'firstName lastName');

        // Group by category
        const groupedSettings = settings.reduce((acc, setting) => {
            if (!acc[setting.category]) {
                acc[setting.category] = [];
            }
            acc[setting.category].push(setting);
            return acc;
        }, {});

        res.status(200).json({
            status: 'success',
            data: { settings: groupedSettings }
        });
    } catch (error) {
        next(error);
    }
};

// Update clinic settings
exports.updateClinicSettings = async (req, res, next) => {
    try {
        const updates = req.body;
        const updatedSettings = [];

        for (const [key, value] of Object.entries(updates)) {
            const setting = await Setting.findOneAndUpdate(
                { category: 'clinic', key },
                { value, updatedBy: req.user._id },
                { new: true, upsert: true, runValidators: true }
            );
            updatedSettings.push(setting);
        }

        res.status(200).json({
            status: 'success',
            data: { settings: updatedSettings }
        });
    } catch (error) {
        next(error);
    }
};

// Update appointment settings
exports.updateAppointmentSettings = async (req, res, next) => {
    try {
        const updates = req.body;
        const updatedSettings = [];

        for (const [key, value] of Object.entries(updates)) {
            const setting = await Setting.findOneAndUpdate(
                { category: 'appointment', key },
                { value, updatedBy: req.user._id },
                { new: true, upsert: true, runValidators: true }
            );
            updatedSettings.push(setting);
        }

        res.status(200).json({
            status: 'success',
            data: { settings: updatedSettings }
        });
    } catch (error) {
        next(error);
    }
};

// Update billing settings
exports.updateBillingSettings = async (req, res, next) => {
    try {
        const updates = req.body;
        const updatedSettings = [];

        for (const [key, value] of Object.entries(updates)) {
            const setting = await Setting.findOneAndUpdate(
                { category: 'billing', key },
                { value, updatedBy: req.user._id },
                { new: true, upsert: true, runValidators: true }
            );
            updatedSettings.push(setting);
        }

        res.status(200).json({
            status: 'success',
            data: { settings: updatedSettings }
        });
    } catch (error) {
        next(error);
    }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res, next) => {
    try {
        const updates = req.body;
        const updatedSettings = [];

        for (const [key, value] of Object.entries(updates)) {
            const setting = await Setting.findOneAndUpdate(
                { category: 'notification', key },
                { value, updatedBy: req.user._id },
                { new: true, upsert: true, runValidators: true }
            );
            updatedSettings.push(setting);
        }

        res.status(200).json({
            status: 'success',
            data: { settings: updatedSettings }
        });
    } catch (error) {
        next(error);
    }
};

// Get setting by category and key
exports.getSetting = async (req, res, next) => {
    try {
        const { category, key } = req.params;

        const setting = await Setting.findOne({ category, key });
        if (!setting) {
            return res.status(404).json({
                status: 'error',
                message: 'Setting not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { setting }
        });
    } catch (error) {
        next(error);
    }
};

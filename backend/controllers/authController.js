const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const { getOrCreateLicense } = require('../middleware/permissions.middleware');

exports.register = async (req, res, next) => {
    try {
        const { username, email, password, firstName, lastName, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({
                status: 'error',
                message: 'User already exists',
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            firstName,
            lastName,
            role: role || 'receptionist',
        });

        // Generate token
        const token = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        const lic = await getOrCreateLicense();
        const licensePayload = {
            isActive: lic.isActive,
            enabledModules: lic.enabledModules || [],
        };

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    permissions: user.permissions || [],
                },
                token,
                refreshToken,
                license: licensePayload,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists includes password
        const user = await User.findOne({
            $or: [
                { email },
                { username: email },
            ],
        }).select('+password');
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials',
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials',
            });
        }

        // Generate token
        const token = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        const lic = await getOrCreateLicense();
        const licensePayload = {
            isActive: lic.isActive,
            enabledModules: lic.enabledModules || [],
        };

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    permissions: user.permissions || [],
                },
                token,
                refreshToken,
                license: licensePayload,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.ownerLogin = async (req, res, next) => {
    try {
        const { email, password, licenseKey } = req.body;

        const user = await User.findOne({
            $or: [
                { email },
                { username: email },
            ],
        }).select('+password');

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        if (user.role !== 'superadmin') {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const lic = await getOrCreateLicense();
        const provided = String(licenseKey || '').trim();
        const expected = String(lic.licenseKey || '').trim();
        if (!provided || !expected || provided !== expected) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const token = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    permissions: user.permissions || [],
                },
                token,
                refreshToken,
                license: {
                    isActive: lic.isActive,
                    enabledModules: lic.enabledModules || [],
                    licenseKey: lic.licenseKey,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.logout = (req, res) => {
    // Client side should remove token
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
    });
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const lic = await getOrCreateLicense();
        const licensePayload = {
            isActive: lic.isActive,
            enabledModules: lic.enabledModules || [],
        };
        if (req.user?.role === 'superadmin') {
            licensePayload.licenseKey = lic.licenseKey;
        }
        res.status(200).json({
            status: 'success',
            data: {
                user,
                license: licensePayload,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.updateMe = async (req, res, next) => {
    try {
        const { firstName, lastName, phone } = req.body;

        // Filter out restricted fields
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { firstName, lastName, phone },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                status: 'error',
                message: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password updated successfully',
        });
    } catch (error) {
        next(error);
    }
};

exports.refreshToken = async (req, res, next) => {
    // Implementation depends on refresh token strategy (DB storage vs JWT only)
    // For now, returning not implemented or simple renewal
    // Real layout usually requires verifying refresh token and issuing new access token
    res.status(501).json({ message: 'Refresh token not implemented yet' });
};

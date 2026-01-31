const Staff = require('../models/Staff');
const User = require('../models/User');

const allowedSpecializations = new Set([
    'general-dentistry',
    'orthodontics',
    'periodontics',
    'endodontics',
    'oral-surgery',
    'pediatric-dentistry',
    'prosthodontics',
    'cosmetic-dentistry',
    'dental-hygienist',
    'dental-assistant',
    'receptionist',
    'other',
]);

const normalizeSpecialization = (value) => {
    if (value === undefined || value === null) return undefined;
    const v = String(value).trim();
    if (!v) return undefined;
    const normalized = v
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-')
        .replace(/[^a-z-]/g, '');
    if (allowedSpecializations.has(normalized)) return normalized;
    return 'other';
};

const generateUsername = async (email, firstName, lastName) => {
    const base = (email?.split('@')?.[0] || `${firstName || ''}${lastName || ''}` || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20) || 'user';

    let username = base;
    let i = 0;
    while (await User.findOne({ username })) {
        i += 1;
        username = `${base}${i}`.slice(0, 25);
    }
    return username;
};

const normalizeStaff = (staffDoc) => {
    const u = staffDoc?.user || {};
    return {
        _id: staffDoc._id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        specialization: staffDoc.specialization,
        isActive: staffDoc.isActive,
        createdAt: staffDoc.createdAt,
    };
};

exports.getAllStaff = async (req, res, next) => {
    try {
        const staffDocs = await Staff.find()
            .populate('user', 'username firstName lastName email phone role')
            .sort('-createdAt');
        const staff = staffDocs.map(normalizeStaff);
        res.status(200).json({ status: 'success', data: { staff } });
    } catch (error) { next(error); }
};

exports.getStaffById = async (req, res, next) => {
    try {
        const staffDoc = await Staff.findById(req.params.id).populate('user', 'username firstName lastName email phone role');
        if (!staffDoc) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json({ status: 'success', data: { staffMember: normalizeStaff(staffDoc) } });
    } catch (error) { next(error); }
};

exports.createStaff = async (req, res, next) => {
    try {
        const { username: requestedUsername, firstName, lastName, email, phone, role, specialization, password } = req.body || {};
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ status: 'error', message: 'firstName, lastName, and email are required' });
        }

        const safeRole = role || 'receptionist';
        if (!['admin', 'dentist', 'receptionist'].includes(safeRole)) {
            return res.status(400).json({ status: 'error', message: 'Invalid role' });
        }

        const existing = await User.findOne({
            $or: [
                { email },
                ...(requestedUsername ? [{ username: requestedUsername }] : []),
            ],
        });
        if (existing) {
            return res.status(400).json({ status: 'error', message: 'A user with this email/username already exists' });
        }

        const username = requestedUsername || await generateUsername(email, firstName, lastName);
        const tempPassword = password || `Temp${Math.random().toString(36).slice(2, 10)}!`;
        const normalizedSpecialization = normalizeSpecialization(specialization);

        const user = await User.create({
            username,
            email,
            password: tempPassword,
            firstName,
            lastName,
            phone,
            role: safeRole,
            specialization: normalizedSpecialization,
        });

        const staffDoc = await Staff.create({
            user: user._id,
            specialization: normalizedSpecialization,
        });

        const populated = await Staff.findById(staffDoc._id).populate('user', 'username firstName lastName email phone role');

        res.status(201).json({
            status: 'success',
            data: {
                staffMember: normalizeStaff(populated),
                tempPassword: password ? undefined : tempPassword,
            },
        });
    } catch (error) { next(error); }
};

exports.updateStaff = async (req, res, next) => {
    try {
        const { username, password, firstName, lastName, email, phone, role, specialization, isActive } = req.body || {};

        const staffDoc = await Staff.findById(req.params.id);
        if (!staffDoc) return res.status(404).json({ status: 'error', message: 'Not found' });

        const userDoc = await User.findById(staffDoc.user).select('+password');
        if (!userDoc) return res.status(404).json({ status: 'error', message: 'Linked user not found' });

        if (email !== undefined && email !== userDoc.email) {
            const emailTaken = await User.findOne({ email, _id: { $ne: userDoc._id } });
            if (emailTaken) return res.status(400).json({ status: 'error', message: 'Email already in use' });
        }
        if (username !== undefined && username !== userDoc.username) {
            const usernameTaken = await User.findOne({ username, _id: { $ne: userDoc._id } });
            if (usernameTaken) return res.status(400).json({ status: 'error', message: 'Username already in use' });
        }

        if (specialization !== undefined) staffDoc.specialization = normalizeSpecialization(specialization);
        if (isActive !== undefined) staffDoc.isActive = isActive;
        await staffDoc.save();

        if (firstName !== undefined) userDoc.firstName = firstName;
        if (lastName !== undefined) userDoc.lastName = lastName;
        if (email !== undefined) userDoc.email = email;
        if (phone !== undefined) userDoc.phone = phone;
        if (role !== undefined) userDoc.role = role;
        if (specialization !== undefined) userDoc.specialization = normalizeSpecialization(specialization);
        if (username !== undefined) userDoc.username = username;
        if (password) userDoc.password = password;
        await userDoc.save();

        const populated = await Staff.findById(staffDoc._id).populate('user', 'username firstName lastName email phone role');
        res.status(200).json({ status: 'success', data: { staffMember: normalizeStaff(populated) } });
    } catch (error) { next(error); }
};

exports.deleteStaff = async (req, res, next) => {
    try {
        const staffDoc = await Staff.findById(req.params.id);
        if (!staffDoc) return res.status(404).json({ status: 'error', message: 'Not found' });

        await Staff.findByIdAndDelete(req.params.id);
        await User.findByIdAndDelete(staffDoc.user);

        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) { next(error); }
};

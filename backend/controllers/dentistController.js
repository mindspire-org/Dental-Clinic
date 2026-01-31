const User = require('../models/User');

const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
    }
    return undefined;
};

exports.getAllDentists = async (req, res, next) => {
    try {
        const { isActive, search } = req.query;
        const query = { role: 'dentist' };

        if (typeof isActive !== 'undefined') {
            query.isActive = String(isActive) === 'true';
        }

        if (search) {
            const q = String(search).trim();
            query.$or = [
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } },
            ];
        }

        const dentists = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: { dentists },
        });
    } catch (error) {
        next(error);
    }
};

exports.getDentistById = async (req, res, next) => {
    try {
        const dentist = await User.findOne({ _id: req.params.id, role: 'dentist' }).select('-password');
        if (!dentist) {
            return res.status(404).json({ status: 'error', message: 'Dentist not found' });
        }
        res.status(200).json({
            status: 'success',
            data: { dentist },
        });
    } catch (error) {
        next(error);
    }
};

exports.createDentist = async (req, res, next) => {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            phone,
            specialization,
            licenseNumber,
            experienceYears,
            checkupFee,
            address,
            avatar,
            isActive,
        } = req.body;

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ status: 'error', message: 'User already exists' });
        }

        const dentist = await User.create({
            username,
            email,
            password,
            firstName,
            lastName,
            phone,
            specialization,
            licenseNumber,
            experienceYears,
            checkupFee: typeof checkupFee !== 'undefined' ? Number(checkupFee) : undefined,
            address,
            avatar,
            role: 'dentist',
            isActive: typeof parseBoolean(isActive) === 'boolean' ? parseBoolean(isActive) : true,
        });

        const dto = dentist.toObject();
        delete dto.password;

        res.status(201).json({
            status: 'success',
            data: { dentist: dto },
        });
    } catch (error) {
        next(error);
    }
};

exports.updateDentist = async (req, res, next) => {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            phone,
            specialization,
            licenseNumber,
            experienceYears,
            checkupFee,
            address,
            avatar,
            isActive,
        } = req.body;

        const dentist = await User.findOne({ _id: req.params.id, role: 'dentist' }).select('+password');
        if (!dentist) {
            return res.status(404).json({ status: 'error', message: 'Dentist not found' });
        }

        if (typeof username !== 'undefined') dentist.username = username;
        if (typeof email !== 'undefined') dentist.email = email;
        if (typeof firstName !== 'undefined') dentist.firstName = firstName;
        if (typeof lastName !== 'undefined') dentist.lastName = lastName;
        if (typeof phone !== 'undefined') dentist.phone = phone;
        if (typeof specialization !== 'undefined') dentist.specialization = specialization;
        if (typeof licenseNumber !== 'undefined') dentist.licenseNumber = licenseNumber;
        if (typeof experienceYears !== 'undefined') dentist.experienceYears = experienceYears;
        if (typeof checkupFee !== 'undefined') dentist.checkupFee = Number(checkupFee);
        if (typeof address !== 'undefined') dentist.address = address;
        if (typeof avatar !== 'undefined') dentist.avatar = avatar;
        const parsedIsActive = parseBoolean(isActive);
        if (typeof parsedIsActive === 'boolean') dentist.isActive = parsedIsActive;
        dentist.role = 'dentist';

        if (password) {
            dentist.password = password;
        }

        await dentist.save();

        const dto = dentist.toObject();
        delete dto.password;

        res.status(200).json({
            status: 'success',
            data: { dentist: dto },
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteDentist = async (req, res, next) => {
    try {
        const dentist = await User.findOneAndDelete({ _id: req.params.id, role: 'dentist' });
        if (!dentist) {
            return res.status(404).json({ status: 'error', message: 'Dentist not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Dentist deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

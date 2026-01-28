const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Treatment = require('../models/Treatment');
const Billing = require('../models/Billing');
const { paginate, getPaginationMeta } = require('../utils/helpers');

exports.getAllPatients = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        let query = {};

        if (search) {
            query = { $text: { $search: search } };
        }

        const patientsQuery = Patient.find(query).sort({ createdAt: -1 });
        const paginatedPatients = await paginate(patientsQuery, page, limit);
        const total = await Patient.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                patients: paginatedPatients,
                meta: getPaginationMeta(total, page, limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.getPatientById = async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                status: 'error',
                message: 'Patient not found',
            });
        }

        res.status(200).json({
            status: 'success',
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
};

exports.createPatient = async (req, res, next) => {
    try {
        const patient = await Patient.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePatient = async (req, res, next) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!patient) {
            return res.status(404).json({
                status: 'error',
                message: 'Patient not found',
            });
        }

        res.status(200).json({
            status: 'success',
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
};

exports.deletePatient = async (req, res, next) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) {
            return res.status(404).json({
                status: 'error',
                message: 'Patient not found',
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Patient deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

exports.searchPatients = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json({ status: 'success', data: { patients: [] } });

        const patients = await Patient.find({
            $text: { $search: q }
        }).limit(10);

        res.status(200).json({
            status: 'success',
            data: { patients },
        });
    } catch (error) {
        next(error);
    }
};

exports.getPatientAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.find({ patient: req.params.id })
            .populate('dentist', 'firstName lastName')
            .sort({ appointmentDate: -1 });

        res.status(200).json({
            status: 'success',
            data: { appointments },
        });
    } catch (error) {
        next(error);
    }
};

exports.getPatientTreatments = async (req, res, next) => {
    try {
        const treatments = await Treatment.find({ patient: req.params.id })
            .populate('dentist', 'firstName lastName')
            .sort({ startDate: -1 });

        res.status(200).json({
            status: 'success',
            data: { treatments },
        });
    } catch (error) {
        next(error);
    }
};

exports.getPatientBilling = async (req, res, next) => {
    try {
        const bills = await Billing.find({ patient: req.params.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: { bills },
        });
    } catch (error) {
        next(error);
    }
};

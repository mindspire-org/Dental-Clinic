const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Treatment = require('../models/Treatment');
const Billing = require('../models/Billing');
const { paginate, getPaginationMeta } = require('../utils/helpers');

const getDentistPatientIds = async (dentistId) => {
    const LabWork = require('../models/LabWork');
    const Prescription = require('../models/Prescription');

    const [fromAppointments, fromTreatments, fromLabWork, fromPrescriptions] = await Promise.all([
        Appointment.find({ dentist: dentistId }).distinct('patient'),
        Treatment.find({ dentist: dentistId }).distinct('patient'),
        LabWork.find({ dentist: dentistId }).distinct('patient'),
        Prescription.find({ dentist: dentistId }).distinct('patient'),
    ]);

    const ids = new Set([
        ...fromAppointments.map(String),
        ...fromTreatments.map(String),
        ...fromLabWork.map(String),
        ...fromPrescriptions.map(String),
    ]);
    return Array.from(ids);
};

exports.getAllPatients = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        let query = {};

        if (search) {
            query = { $text: { $search: search } };
        }

        if (req.user?.role === 'dentist' && req.user?._id) {
            const allowedIds = await getDentistPatientIds(req.user._id);
            const dentistFilter = { _id: { $in: allowedIds } };
            query = Object.keys(query).length ? { $and: [dentistFilter, query] } : dentistFilter;
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
        if (req.user?.role === 'dentist' && req.user?._id) {
            const allowedIds = await getDentistPatientIds(req.user._id);
            if (!allowedIds.includes(String(req.params.id))) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Patient not found',
                });
            }
        }

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

        let query = { $text: { $search: q } };
        if (req.user?.role === 'dentist' && req.user?._id) {
            const allowedIds = await getDentistPatientIds(req.user._id);
            query = { $and: [{ _id: { $in: allowedIds } }, query] };
        }

        const patients = await Patient.find(query).limit(10);

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
        const query = { patient: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const appointments = await Appointment.find(query)
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
        const query = { patient: req.params.id };
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const treatments = await Treatment.find(query)
            .populate('dentist', 'firstName lastName checkupFee')
            .populate('procedure', 'name price')
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
        let query = { patient: req.params.id };

        if (req.user?.role === 'dentist' && req.user?._id) {
            const LabWork = require('../models/LabWork');
            const Prescription = require('../models/Prescription');

            const [appointmentIds, treatmentIds, labWorkIds, prescriptionIds] = await Promise.all([
                Appointment.find({ dentist: req.user._id, patient: req.params.id }).distinct('_id'),
                Treatment.find({ dentist: req.user._id, patient: req.params.id }).distinct('_id'),
                LabWork.find({ dentist: req.user._id, patient: req.params.id }).distinct('_id'),
                Prescription.find({ dentist: req.user._id, patient: req.params.id }).distinct('_id'),
            ]);

            query = {
                patient: req.params.id,
                $or: [
                    { appointment: { $in: appointmentIds } },
                    { treatment: { $in: treatmentIds } },
                    { labWork: { $in: labWorkIds } },
                    { prescription: { $in: prescriptionIds } },
                ],
            };
        }

        const bills = await Billing.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: { bills },
        });
    } catch (error) {
        next(error);
    }
};

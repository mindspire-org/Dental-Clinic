const DentalChart = require('../models/DentalChart');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Treatment = require('../models/Treatment');
const LabWork = require('../models/LabWork');
const Prescription = require('../models/Prescription');

const getUpdaterId = async (req) => {
    const direct = req.user?._id || req.user?.id;
    if (direct) return direct;
    const admin = await User.findOne({ role: 'admin' }).select('_id');
    const anyUser = admin || (await User.findOne({}).select('_id'));
    return anyUser?._id;
};

const normalizeCondition = (condition) => {
    const c = String(condition || '').trim().toLowerCase();
    if (!c) return 'healthy';
    if (c === 'filling') return 'filled';
    if (c === 'filled') return 'filled';
    if (c === 'root-canal') return 'root_canal';
    if (c === 'root_canal') return 'root_canal';
    if (c === 'extraction-needed') return 'extraction_needed';
    if (c === 'extraction_needed') return 'extraction_needed';
    return c;
};

const fdiAdultTeeth = () => {
    const list = [
        18, 17, 16, 15, 14, 13, 12, 11,
        21, 22, 23, 24, 25, 26, 27, 28,
        48, 47, 46, 45, 44, 43, 42, 41,
        31, 32, 33, 34, 35, 36, 37, 38,
    ];
    return list.map((toothNumber) => ({
        toothNumber,
        condition: 'healthy',
        treatments: [],
        notes: '',
    }));
};

const getDentistPatientIds = async (dentistId) => {
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

// Get patient's dental chart
exports.getPatientChart = async (req, res, next) => {
    try {
        const { patientId } = req.params;

        if (req.user?.role === 'dentist' && req.user?._id) {
            const allowedIds = await getDentistPatientIds(req.user._id);
            if (!allowedIds.includes(String(patientId))) {
                return res.status(404).json({ status: 'error', message: 'Patient not found' });
            }
        }

        // Verify patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                status: 'error',
                message: 'Patient not found'
            });
        }

        // Get or create dental chart
        let chart = await DentalChart.findOne({ patient: patientId })
            .populate('teeth.treatments.treatment', 'name category')
            .populate('teeth.treatments.dentist', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName');

        if (!chart) {
            const teeth = fdiAdultTeeth();
            const updaterId = await getUpdaterId(req);
            chart = await DentalChart.create({
                patient: patientId,
                teeth,
                updatedBy: updaterId,
            });
        }

        res.status(200).json({
            status: 'success',
            data: { chart }
        });
    } catch (error) {
        next(error);
    }
};

// Update dental chart
exports.updateChart = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { teeth } = req.body;

        if (req.user?.role === 'dentist' && req.user?._id) {
            const allowedIds = await getDentistPatientIds(req.user._id);
            if (!allowedIds.includes(String(patientId))) {
                return res.status(404).json({ status: 'error', message: 'Dental chart not found' });
            }
        }

        const chart = await DentalChart.findOne({ patient: patientId });

        if (!chart) {
            return res.status(404).json({
                status: 'error',
                message: 'Dental chart not found'
            });
        }

        // Merge updates by toothNumber to preserve existing treatment history
        if (Array.isArray(teeth)) {
            const incoming = new Map(
                teeth
                    .filter((t) => typeof t?.toothNumber === 'number')
                    .map((t) => [t.toothNumber, t])
            );

            chart.teeth.forEach((t) => {
                const nextTooth = incoming.get(t.toothNumber);
                if (!nextTooth) return;
                if (typeof nextTooth.condition !== 'undefined') {
                    t.condition = normalizeCondition(nextTooth.condition);
                }
                if (typeof nextTooth.notes !== 'undefined') {
                    t.notes = nextTooth.notes;
                }
            });
        }

        chart.updatedBy = await getUpdaterId(req);
        chart.lastUpdated = new Date();
        await chart.save();

        res.status(200).json({
            status: 'success',
            data: { chart }
        });
    } catch (error) {
        next(error);
    }
};

// Add treatment to specific tooth
exports.addToothTreatment = async (req, res, next) => {
    try {
        const { patientId, toothNumber } = req.params;
        const { treatment, treatmentType, description, notes, status } = req.body;

        if (req.user?.role === 'dentist' && req.user?._id) {
            const allowedIds = await getDentistPatientIds(req.user._id);
            if (!allowedIds.includes(String(patientId))) {
                return res.status(404).json({ status: 'error', message: 'Dental chart not found' });
            }
        }

        const chart = await DentalChart.findOne({ patient: patientId });
        if (!chart) {
            return res.status(404).json({
                status: 'error',
                message: 'Dental chart not found'
            });
        }

        const tooth = chart.teeth.find(t => t.toothNumber === parseInt(toothNumber));
        if (!tooth) {
            return res.status(404).json({
                status: 'error',
                message: 'Tooth not found'
            });
        }

        const dentistId = await getUpdaterId(req);
        tooth.treatments.push({
            treatment,
            treatmentType,
            description,
            date: new Date(),
            dentist: dentistId,
            notes,
            status: status || 'planned'
        });

        chart.updatedBy = dentistId;
        chart.lastUpdated = new Date();
        await chart.save();

        res.status(201).json({
            status: 'success',
            data: { chart }
        });
    } catch (error) {
        next(error);
    }
};

// Update tooth treatment
exports.updateToothTreatment = async (req, res, next) => {
    try {
        const { patientId, toothNumber, treatmentId } = req.params;
        const { status, notes, condition, treatmentType, description } = req.body;

        if (req.user?.role === 'dentist' && req.user?._id) {
            const allowedIds = await getDentistPatientIds(req.user._id);
            if (!allowedIds.includes(String(patientId))) {
                return res.status(404).json({ status: 'error', message: 'Dental chart not found' });
            }
        }

        const chart = await DentalChart.findOne({ patient: patientId });
        if (!chart) {
            return res.status(404).json({
                status: 'error',
                message: 'Dental chart not found'
            });
        }

        const tooth = chart.teeth.find(t => t.toothNumber === parseInt(toothNumber));
        if (!tooth) {
            return res.status(404).json({
                status: 'error',
                message: 'Tooth not found'
            });
        }

        const treatment = tooth.treatments.id(treatmentId);
        if (!treatment) {
            return res.status(404).json({
                status: 'error',
                message: 'Treatment not found'
            });
        }

        if (status) treatment.status = status;
        if (notes) treatment.notes = notes;
        if (treatmentType) treatment.treatmentType = treatmentType;
        if (description) treatment.description = description;
        if (condition) tooth.condition = normalizeCondition(condition);

        chart.updatedBy = await getUpdaterId(req);
        chart.lastUpdated = new Date();
        await chart.save();

        res.status(200).json({
            status: 'success',
            data: { chart }
        });
    } catch (error) {
        next(error);
    }
};

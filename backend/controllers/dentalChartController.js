const DentalChart = require('../models/DentalChart');
const Patient = require('../models/Patient');

// Get patient's dental chart
exports.getPatientChart = async (req, res, next) => {
    try {
        const { patientId } = req.params;

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
            // Create default chart with all 32 teeth
            const teeth = Array.from({ length: 32 }, (_, i) => ({
                toothNumber: i + 1,
                condition: 'healthy',
                treatments: [],
                notes: ''
            }));

            chart = await DentalChart.create({
                patient: patientId,
                teeth,
                updatedBy: req.user._id
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

        const chart = await DentalChart.findOneAndUpdate(
            { patient: patientId },
            {
                teeth,
                updatedBy: req.user._id,
                lastUpdated: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!chart) {
            return res.status(404).json({
                status: 'error',
                message: 'Dental chart not found'
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

// Add treatment to specific tooth
exports.addToothTreatment = async (req, res, next) => {
    try {
        const { patientId, toothNumber } = req.params;
        const { treatment, notes, status } = req.body;

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

        tooth.treatments.push({
            treatment,
            date: new Date(),
            dentist: req.user._id,
            notes,
            status: status || 'planned'
        });

        chart.updatedBy = req.user._id;
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
        const { status, notes, condition } = req.body;

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
        if (condition) tooth.condition = condition;

        chart.updatedBy = req.user._id;
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

const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required'],
    },
    dentist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Dentist is required'],
    },
    treatment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Treatment',
    },
    prescriptionNumber: {
        type: String,
        unique: true,
        required: true,
    },
    medications: [{
        name: {
            type: String,
            required: [true, 'Medication name is required'],
        },
        dosage: {
            type: String,
            required: [true, 'Dosage is required'],
        },
        frequency: {
            type: String,
            required: [true, 'Frequency is required'],
        },
        duration: {
            type: String,
            required: [true, 'Duration is required'],
        },
        instructions: String,
    }],
    instructions: String,
    prescriptionDate: {
        type: Date,
        default: Date.now,
    },
    validUntil: Date,
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active',
    },
}, {
    timestamps: true,
});

// Auto-generate prescription number
prescriptionSchema.pre('save', async function (next) {
    if (!this.prescriptionNumber) {
        const count = await mongoose.model('Prescription').countDocuments();
        this.prescriptionNumber = `RX${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Index for queries
prescriptionSchema.index({ patient: 1, prescriptionDate: -1 });
prescriptionSchema.index({ prescriptionNumber: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);

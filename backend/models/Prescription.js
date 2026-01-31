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
        unitPrice: {
            type: Number,
            min: 0,
            default: 0,
        },
        quantity: {
            type: Number,
            min: 1,
            default: 1,
        },
        totalPrice: {
            type: Number,
            min: 0,
            default: 0,
        },
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
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Billing',
    },
    totalCost: {
        type: Number,
        default: 0,
        min: 0,
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
});

// Auto-generate prescription number
prescriptionSchema.pre('validate', async function (next) {
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

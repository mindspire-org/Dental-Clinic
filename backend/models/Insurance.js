const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
    claimId: {
        type: String,
        unique: true,
        index: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    provider: {
        type: String,
        required: true,
        trim: true
    },
    policyNumber: {
        type: String,
        required: true,
        trim: true
    },
    groupNumber: {
        type: String,
        trim: true
    },
    treatment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Treatment'
    },
    claimAmount: {
        type: Number,
        required: true,
        min: 0
    },
    approvedAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'approved', 'rejected', 'partially_approved', 'paid'],
        default: 'pending',
        index: true
    },
    submittedDate: {
        type: Date,
        index: true
    },
    processedDate: Date,
    rejectionReason: String,
    notes: String,
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Auto-generate claimId before saving
insuranceSchema.pre('save', async function (next) {
    if (!this.claimId) {
        const count = await mongoose.model('Insurance').countDocuments();
        this.claimId = `CLM-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Insurance', insuranceSchema);

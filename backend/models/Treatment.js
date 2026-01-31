const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required'],
    },
    procedure: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TreatmentProcedure',
    },
    dentist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Dentist is required'],
    },
    treatmentType: {
        type: String,
        required: [true, 'Treatment type is required'],
        enum: [
            'filling',
            'root-canal',
            'crown',
            'bridge',
            'extraction',
            'implant',
            'dentures',
            'whitening',
            'braces',
            'cleaning',
            'scaling',
            'other'
        ],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    teeth: [{
        type: String,
        trim: true,
    }],
    status: {
        type: String,
        enum: ['planned', 'in-progress', 'completed', 'cancelled'],
        default: 'planned',
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    completionDate: Date,
    estimatedCost: {
        type: Number,
        min: 0,
    },
    actualCost: {
        type: Number,
        min: 0,
    },
    paidAmount: {
        type: Number,
        min: 0,
        default: 0,
    },
    progressPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    plannedSessions: {
        type: Number,
        min: 1,
        default: 1,
    },
    notes: String,
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Billing',
    },
    advancePaid: {
        type: Number,
        default: 0,
        min: 0,
    },
    sessions: [{
        date: Date,
        duration: Number,
        notes: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    }],
}, {
    timestamps: true,
});

// Virtual for balance due
treatmentSchema.virtual('balanceDue').get(function () {
    const cost = this.actualCost || this.estimatedCost || 0;
    const paid = (this.paidAmount || 0) + (this.advancePaid || 0);
    return Math.max(0, cost - paid);
});

// Index for queries
treatmentSchema.index({ patient: 1, startDate: -1 });
treatmentSchema.index({ dentist: 1, status: 1 });

module.exports = mongoose.model('Treatment', treatmentSchema);

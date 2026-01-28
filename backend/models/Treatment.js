const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
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
    notes: String,
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

// Index for queries
treatmentSchema.index({ patient: 1, startDate: -1 });
treatmentSchema.index({ dentist: 1, status: 1 });

module.exports = mongoose.model('Treatment', treatmentSchema);

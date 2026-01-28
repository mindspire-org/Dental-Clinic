const mongoose = require('mongoose');

const dentalChartSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        unique: true,
        index: true
    },
    teeth: [{
        toothNumber: {
            type: Number,
            required: true,
            min: 1,
            max: 32
        },
        condition: {
            type: String,
            enum: ['healthy', 'cavity', 'filled', 'crown', 'missing', 'implant', 'root_canal', 'extraction_needed'],
            default: 'healthy'
        },
        treatments: [{
            treatment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Treatment'
            },
            date: {
                type: Date,
                default: Date.now
            },
            dentist: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            notes: String,
            status: {
                type: String,
                enum: ['planned', 'in_progress', 'completed', 'cancelled'],
                default: 'planned'
            }
        }],
        notes: String
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Update lastUpdated on save
dentalChartSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('DentalChart', dentalChartSchema);

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
            max: 99
        },
        condition: {
            type: String,
            enum: [
                'healthy',
                'cavity',
                'filled',
                'filling',
                'crown',
                'missing',
                'implant',
                'root_canal',
                'root-canal',
                'extraction_needed',
                'extraction-needed',
            ],
            default: 'healthy'
        },
        treatments: [{
            treatment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Treatment'
            },
            treatmentType: {
                type: String,
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
                trim: true,
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

// Validate toothNumber for adult FDI notation (11-18, 21-28, 31-38, 41-48)
dentalChartSchema.path('teeth').validate(function (teeth) {
    if (!Array.isArray(teeth)) return true;
    const isValidFdi = (n) => {
        const q = Math.floor(n / 10);
        const p = n % 10;
        return [1, 2, 3, 4].includes(q) && p >= 1 && p <= 8;
    };
    return teeth.every((t) => typeof t?.toothNumber === 'number' && isValidFdi(t.toothNumber));
}, 'Invalid toothNumber. Expected adult FDI notation (11-18, 21-28, 31-38, 41-48).');

// Update lastUpdated on save
dentalChartSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('DentalChart', dentalChartSchema);

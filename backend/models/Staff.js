const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
    },
    employeeId: {
        type: String,
        unique: true,
    },
    specialization: {
        type: String,
        enum: [
            'general-dentistry',
            'orthodontics',
            'periodontics',
            'endodontics',
            'oral-surgery',
            'pediatric-dentistry',
            'prosthodontics',
            'cosmetic-dentistry',
            'dental-hygienist',
            'dental-assistant',
            'receptionist',
            'other'
        ],
    },
    licenseNumber: String,
    hireDate: {
        type: Date,
        default: Date.now,
    },
    schedule: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        startTime: String,
        endTime: String,
        isAvailable: {
            type: Boolean,
            default: true,
        },
    }],
    salary: {
        amount: Number,
        currency: {
            type: String,
            default: 'USD',
        },
        paymentFrequency: {
            type: String,
            enum: ['hourly', 'monthly', 'yearly'],
        },
    },
    department: {
        type: String,
        enum: ['clinical', 'administrative', 'support'],
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    terminationDate: Date,
    notes: String,
}, {
    timestamps: true,
});

// Auto-generate employee ID
staffSchema.pre('validate', async function (next) {
    if (!this.employeeId) {
        const count = await mongoose.model('Staff').countDocuments();
        this.employeeId = `EMP${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Index for queries
staffSchema.index({ user: 1 });
staffSchema.index({ employeeId: 1 });
staffSchema.index({ specialization: 1 });

module.exports = mongoose.model('Staff', staffSchema);

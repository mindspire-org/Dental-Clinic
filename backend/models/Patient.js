const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, 'Gender is required'],
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
    },
    medicalHistory: [{
        condition: String,
        diagnosedDate: Date,
        notes: String,
    }],
    allergies: [{
        allergen: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
        },
        reaction: String,
    }],
    insurance: {
        provider: String,
        policyNumber: String,
        groupNumber: String,
        expiryDate: Date,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    notes: String,
}, {
    timestamps: true,
});

// Virtual for full name
patientSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
patientSchema.virtual('age').get(function () {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
});

// Index for search
patientSchema.index({ firstName: 'text', lastName: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Patient', patientSchema);

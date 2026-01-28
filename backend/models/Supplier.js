const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true,
        index: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    products: [{
        type: String,
        trim: true
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    paymentTerms: {
        type: String,
        trim: true
    },
    notes: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for search
supplierSchema.index({ name: 'text', contactPerson: 'text', email: 'text' });

module.exports = mongoose.model('Supplier', supplierSchema);

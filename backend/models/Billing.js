const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required'],
    },
    treatment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Treatment',
    },
    invoiceNumber: {
        type: String,
        unique: true,
        required: true,
    },
    items: [{
        description: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
    }],
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    tax: {
        type: Number,
        default: 0,
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },
    total: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'partially-paid', 'overdue', 'cancelled'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'insurance', 'bank-transfer', 'other'],
    },
    paymentDate: Date,
    dueDate: Date,
    paidAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    notes: String,
}, {
    timestamps: true,
});

// Auto-generate invoice number
billingSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const count = await mongoose.model('Billing').countDocuments();
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        this.invoiceNumber = `INV${year}${month}${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Calculate balance
billingSchema.virtual('balance').get(function () {
    return this.total - this.paidAmount;
});

// Index for queries
billingSchema.index({ patient: 1, createdAt: -1 });
billingSchema.index({ invoiceNumber: 1 });
billingSchema.index({ status: 1 });

module.exports = mongoose.model('Billing', billingSchema);

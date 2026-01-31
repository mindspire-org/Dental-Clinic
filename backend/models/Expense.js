const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expenseId: {
        type: String,
        unique: true,
        index: true
    },
    category: {
        type: String,
        enum: ['supplies', 'equipment', 'utilities', 'salaries', 'rent', 'maintenance', 'marketing', 'lab_fees', 'other'],
        required: [true, 'Category is required'],
        index: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be positive']
    },
    expenseDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    vendor: {
        type: String,
        trim: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'check', 'other'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'partial'],
        default: 'pending',
        index: true
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    receiptNumber: {
        type: String,
        trim: true
    },
    receiptUrl: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true
});

// Auto-generate expense ID
expenseSchema.pre('validate', async function (next) {
    if (!this.expenseId) {
        const count = await mongoose.model('Expense').countDocuments();
        this.expenseId = `EXP-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Update payment status based on paid amount
expenseSchema.pre('save', function (next) {
    const amount = Number(this.amount || 0);
    const paid = Number(this.paidAmount || 0);

    if (paid <= 0) {
        this.paymentStatus = 'pending';
    } else if (paid >= amount) {
        this.paymentStatus = 'paid';
        this.paidAmount = amount;
    } else {
        this.paymentStatus = 'partial';
    }

    next();
});

// Virtual for balance
expenseSchema.virtual('balance').get(function () {
    return Math.max(0, this.amount - this.paidAmount);
});

// Indexes for efficient queries
expenseSchema.index({ category: 1, expenseDate: -1 });
expenseSchema.index({ vendor: 1 });
expenseSchema.index({ createdBy: 1, expenseDate: -1 });
expenseSchema.index({ approvalStatus: 1, expenseDate: -1 });

module.exports = mongoose.model('Expense', expenseSchema);

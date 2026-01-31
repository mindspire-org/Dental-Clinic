const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        unique: true,
        index: true
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Billing',
        required: true,
        index: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: false,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'insurance', 'check', 'bank_transfer'],
        required: true
    },
    transactionId: {
        type: String,
        trim: true
    },
    notes: String,
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed', 'refunded'],
        default: 'completed'
    }
}, {
    timestamps: true
});

// Auto-generate paymentId before saving
paymentSchema.pre('validate', async function (next) {
    if (!this.paymentId) {
        const count = await mongoose.model('Payment').countDocuments();
        this.paymentId = `PAY-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Payment', paymentSchema);

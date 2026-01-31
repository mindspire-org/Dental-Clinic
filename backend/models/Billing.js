const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: false,
    },
    patientName: {
        type: String,
        trim: true,
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
    invoiceType: {
        type: String,
        enum: ['standard', 'treatment', 'lab', 'insurance', 'checkup', 'procedure', 'prescription', 'other'],
        default: 'standard',
        index: true,
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    labWork: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabWork',
    },
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
    },
    advancePayment: {
        type: Number,
        default: 0,
        min: 0,
    },
    advancePaymentPercentage: {
        type: Number,
        default: 25,
        min: 0,
        max: 100,
    },
    requiresAdvance: {
        type: Boolean,
        default: false,
    },
    billingContext: {
        type: mongoose.Schema.Types.Mixed,
    },
    invoiceDate: {
        type: Date,
        default: Date.now,
        index: true,
    },
    paymentTerms: {
        type: String,
        enum: ['due_on_receipt', 'net_7', 'net_15', 'net_30', 'net_60'],
        default: 'due_on_receipt',
    },
    referenceNo: {
        type: String,
        trim: true,
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
billingSchema.pre('validate', async function (next) {
    if (!this.invoiceNumber) {
        const count = await mongoose.model('Billing').countDocuments();
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        this.invoiceNumber = `INV${year}${month}${String(count + 1).padStart(4, '0')}`;
    }

    // Calculate item totals and invoice totals
    const items = Array.isArray(this.items) ? this.items : [];
    let subtotal = 0;
    items.forEach((item) => {
        const qty = Number(item.quantity || 0);
        const unit = Number(item.unitPrice || 0);
        const lineTotal = qty * unit;
        item.total = lineTotal;
        subtotal += lineTotal;
    });
    this.subtotal = subtotal;
    const tax = Number(this.tax || 0);
    const discount = Number(this.discount || 0);
    this.total = Math.max(0, subtotal + tax - discount);

    const paid = Number(this.paidAmount || 0);
    if (paid <= 0) {
        if (this.status === 'paid' || this.status === 'partially-paid') this.status = 'pending';
    } else if (paid >= this.total) {
        this.status = 'paid';
        this.paidAmount = this.total;
    } else {
        this.status = 'partially-paid';
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

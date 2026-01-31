const mongoose = require('mongoose');

const labWorkSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required'],
    },
    treatment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Treatment',
    },
    dentist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Dentist is required'],
    },
    labName: {
        type: String,
        required: [true, 'Lab name is required'],
    },
    workType: {
        type: String,
        required: [true, 'Work type is required'],
        enum: ['crown', 'bridge', 'denture', 'implant', 'veneer', 'retainer', 'mouthguard', 'other'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    requestDate: {
        type: Date,
        default: Date.now,
    },
    expectedDate: Date,
    completedDate: Date,
    status: {
        type: String,
        enum: ['requested', 'in-progress', 'completed', 'delivered', 'cancelled'],
        default: 'requested',
    },
    cost: {
        type: Number,
        min: 0,
    },
    notes: String,
    trackingNumber: String,
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Billing',
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partial', 'paid'],
        default: 'unpaid',
    },
}, {
    timestamps: true,
});

// Index for queries
labWorkSchema.index({ patient: 1, requestDate: -1 });
labWorkSchema.index({ status: 1 });
labWorkSchema.index({ dentist: 1 });

module.exports = mongoose.model('LabWork', labWorkSchema);

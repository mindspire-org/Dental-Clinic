const mongoose = require('mongoose');

const waitingListSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        contact: {
            type: String,
            trim: true,
            default: '',
        },
        priority: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium',
        },
        reason: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: ['Waiting', 'Notified'],
            default: 'Waiting',
        },
    },
    {
        timestamps: true,
    }
);

waitingListSchema.index({ status: 1, priority: 1, createdAt: -1 });
waitingListSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('WaitingList', waitingListSchema);

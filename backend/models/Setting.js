const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['clinic', 'appointment', 'billing', 'notification', 'system'],
        index: true
    },
    key: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound unique index
settingSchema.index({ category: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Setting', settingSchema);

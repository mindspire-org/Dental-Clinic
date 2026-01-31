const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
    licenseKey: {
        type: String,
        index: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    activatedAt: {
        type: Date,
    },
    activatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    enabledModules: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});

licenseSchema.index({ isActive: 1 });

module.exports = mongoose.model('License', licenseSchema);

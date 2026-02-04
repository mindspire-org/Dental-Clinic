const mongoose = require('mongoose');

const labTestTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        index: true,
    },
    labName: {
        type: String,
        trim: true,
        default: '',
    },
    workType: {
        type: String,
        enum: ['crown', 'bridge', 'denture', 'implant', 'veneer', 'retainer', 'mouthguard', 'other'],
        required: [true, 'Work type is required'],
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    defaultCost: {
        type: Number,
        min: 0,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

labTestTemplateSchema.index({ name: 1 });

module.exports = mongoose.model('LabTestTemplate', labTestTemplateSchema);

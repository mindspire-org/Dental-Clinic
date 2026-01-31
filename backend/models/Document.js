const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        default: null,
        index: true,
    },
    isFolder: {
        type: Boolean,
        default: false,
        index: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    treatment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Treatment',
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader is required'],
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: String,
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'consent-form',
            'medical-history',
            'x-ray',
            'photo',
            'report',
            'treatment-plan',
            'lab-report',
            'prescription',
            'invoice',
            'insurance',
            'other'
        ],
    },
    fileName: {
        type: String,
        required: function () { return !this.isFolder; },
    },
    filePath: {
        type: String,
        required: function () { return !this.isFolder; },
    },
    fileSize: {
        type: Number,
        min: 0,
    },
    mimeType: String,
    uploadDate: {
        type: Date,
        default: Date.now,
    },
    tags: [String],
    isArchived: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Index for queries
documentSchema.index({ patient: 1, uploadDate: -1 });
documentSchema.index({ category: 1 });
documentSchema.index({ parent: 1, uploadDate: -1 });
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Document', documentSchema);

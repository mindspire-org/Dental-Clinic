const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
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
            'prescription',
            'invoice',
            'insurance',
            'other'
        ],
    },
    fileName: {
        type: String,
        required: [true, 'File name is required'],
    },
    filePath: {
        type: String,
        required: [true, 'File path is required'],
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
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Document', documentSchema);

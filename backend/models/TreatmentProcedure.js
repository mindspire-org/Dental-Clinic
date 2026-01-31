const mongoose = require('mongoose');

const treatmentProcedureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0,
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: 0,
    },
    sessions: {
        type: Number,
        default: 1,
        min: 1,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

treatmentProcedureSchema.index({ name: 1 });

treatmentProcedureSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('TreatmentProcedure', treatmentProcedureSchema);

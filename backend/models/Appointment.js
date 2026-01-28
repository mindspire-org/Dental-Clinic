const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required'],
    },
    dentist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Dentist is required'],
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
    },
    duration: {
        type: Number,
        default: 30,
        min: [15, 'Minimum duration is 15 minutes'],
    },
    type: {
        type: String,
        enum: ['checkup', 'cleaning', 'filling', 'extraction', 'root-canal', 'crown', 'consultation', 'emergency', 'other'],
        required: [true, 'Appointment type is required'],
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled',
    },
    notes: String,
    reminderSent: {
        type: Boolean,
        default: false,
    },
    cancellationReason: String,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    cancelledAt: Date,
}, {
    timestamps: true,
});

// Index for efficient queries
appointmentSchema.index({ appointmentDate: 1, dentist: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1 });

// Virtual for end time
appointmentSchema.virtual('endTime').get(function () {
    return new Date(this.appointmentDate.getTime() + this.duration * 60000);
});

module.exports = mongoose.model('Appointment', appointmentSchema);

const { body, param } = require('express-validator');

// Appointment validation rules
const createAppointmentValidation = [
    body('patient').isMongoId().withMessage('Valid patient ID is required'),
    body('dentist').isMongoId().withMessage('Valid dentist ID is required'),
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
    body('type').isIn(['checkup', 'cleaning', 'filling', 'extraction', 'root_canal', 'other']).withMessage('Valid appointment type is required'),
];

const updateAppointmentValidation = [
    param('id').isMongoId().withMessage('Valid appointment ID is required'),
    body('patient').optional().isMongoId(),
    body('dentist').optional().isMongoId(),
    body('appointmentDate').optional().isISO8601(),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
];

module.exports = {
    createAppointmentValidation,
    updateAppointmentValidation
};

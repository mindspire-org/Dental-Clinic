const { body, param, query, validationResult } = require('express-validator');

// Patient validation rules
const createPatientValidation = [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
];

const updatePatientValidation = [
    param('id').isMongoId().withMessage('Valid patient ID is required'),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('phone').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
];

module.exports = {
    createPatientValidation,
    updatePatientValidation
};

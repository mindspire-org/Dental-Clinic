const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

// Validation rules
const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
];

// Routes
router.post('/login', loginValidation, validate, authController.login);
router.post('/register', registerValidation, validate, authController.register);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.put('/me', auth, authController.updateMe);
router.post('/change-password', auth, authController.changePassword);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;

const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No authentication token provided',
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Find user
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found',
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                status: 'error',
                message: 'User account is deactivated',
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token',
        });
    }
};

module.exports = auth;

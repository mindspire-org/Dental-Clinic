const jwt = require('jsonwebtoken');

const jwtConfig = {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
};

const generateToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
    );
};

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        jwtConfig.refreshSecret,
        { expiresIn: jwtConfig.refreshExpiresIn }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.refreshSecret);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

module.exports = {
    jwtConfig,
    generateToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken,
};

const AuditLog = require('../models/AuditLog');

// Audit logging middleware
const auditLog = (action) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function to log after response
        res.send = function (data) {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Extract resource information
                const resourceId = req.params.id || req.body._id || req.body.id;
                const resourceType = req.baseUrl.split('/').pop();

                // Create audit log entry
                AuditLog.create({
                    user: req.user?._id,
                    action,
                    module: resourceType,
                    resourceId,
                    resourceType,
                    changes: action === 'UPDATE' ? req.body : undefined,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent'),
                    timestamp: new Date()
                }).catch(err => {
                    console.error('Audit log error:', err);
                });
            }

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};

module.exports = { auditLog };

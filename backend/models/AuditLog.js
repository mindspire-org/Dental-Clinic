const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
        index: true
    },
    module: {
        type: String,
        required: true,
        index: true
    },
    resourceId: {
        type: String,
        index: true
    },
    resourceType: {
        type: String,
        index: true
    },
    changes: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

// TTL index to automatically delete logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('AuditLog', auditLogSchema);

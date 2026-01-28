const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

// Get dashboard statistics
exports.getStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Total patients
        const totalPatients = await Patient.countDocuments({ isActive: true });

        // Appointments today
        const appointmentsToday = await Appointment.countDocuments({
            appointmentDate: { $gte: today, $lt: tomorrow },
            status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
        });

        // Total revenue (this month)
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const payments = await Payment.aggregate([
            {
                $match: {
                    paymentDate: { $gte: startOfMonth },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const monthlyRevenue = payments.length > 0 ? payments[0].total : 0;

        // Pending payments
        const pendingBills = await Billing.aggregate([
            {
                $match: {
                    status: { $in: ['sent', 'overdue'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$balance' }
                }
            }
        ]);
        const pendingPayments = pendingBills.length > 0 ? pendingBills[0].total : 0;

        res.status(200).json({
            status: 'success',
            data: {
                totalPatients,
                appointmentsToday,
                monthlyRevenue,
                pendingPayments
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get recent activities
exports.getRecentActivities = async (req, res, next) => {
    try {
        const activities = await AuditLog.find()
            .populate('user', 'firstName lastName')
            .sort({ timestamp: -1 })
            .limit(10);

        res.status(200).json({
            status: 'success',
            data: { activities }
        });
    } catch (error) {
        next(error);
    }
};

// Get upcoming appointments
exports.getUpcomingAppointments = async (req, res, next) => {
    try {
        const now = new Date();
        const appointments = await Appointment.find({
            appointmentDate: { $gte: now },
            status: { $in: ['scheduled', 'confirmed'] }
        })
            .populate('patient', 'firstName lastName phone')
            .populate('dentist', 'firstName lastName')
            .sort({ appointmentDate: 1 })
            .limit(5);

        res.status(200).json({
            status: 'success',
            data: { appointments }
        });
    } catch (error) {
        next(error);
    }
};

// Get revenue chart data
exports.getRevenueChart = async (req, res, next) => {
    try {
        const { period = 'month' } = req.query;
        const now = new Date();
        let startDate;

        if (period === 'week') {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (period === 'year') {
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        } else {
            // Default to month
            startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        const revenueData = await Payment.aggregate([
            {
                $match: {
                    paymentDate: { $gte: startDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' }
                    },
                    revenue: { $sum: '$amount' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: { revenueData }
        });
    } catch (error) {
        next(error);
    }
};

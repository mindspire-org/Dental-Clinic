const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const Treatment = require('../models/Treatment');

const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
};

const formatYmd = (d) => {
    const x = new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const formatYm = (d) => {
    const x = new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
};

const normalizeAppointmentStatus = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'in-progress') return 'in_progress';
    if (s === 'no-show') return 'no_show';
    return s;
};

const getMonthRange = (date) => {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return { start, end };
};

const safePercentDelta = (current, previous) => {
    const c = Number(current || 0);
    const p = Number(previous || 0);
    if (!p) return null;
    return ((c - p) / p) * 100;
};

// Get dashboard statistics
exports.getStats = async (req, res, next) => {
    try {
        const today = startOfDay(new Date());
        const tomorrow = addDays(today, 1);

        const dentistScope = req.user?.role === 'dentist' && req.user?._id ? req.user._id : null;

        // Total patients
        const totalPatients = dentistScope
            ? await Appointment.distinct('patient', { dentist: dentistScope }).then((ids) => ids.length)
            : await Patient.countDocuments({ isActive: true });

        // Patients created this month vs last month
        const { start: startOfThisMonth, end: startOfNextMonth } = getMonthRange(today);
        const { start: startOfLastMonth, end: startOfThisMonthAgain } = getMonthRange(addDays(startOfThisMonth, -1));
        const [newPatientsThisMonth, newPatientsLastMonth] = await Promise.all([
            Patient.countDocuments({ createdAt: { $gte: startOfThisMonth, $lt: startOfNextMonth } }),
            Patient.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonthAgain } }),
        ]);

        // Appointments today
        const appointmentsTodayQuery = {
            appointmentDate: { $gte: today, $lt: tomorrow },
            status: { $in: ['scheduled', 'confirmed', 'in_progress', 'in-progress'] }
        };
        if (dentistScope) appointmentsTodayQuery.dentist = dentistScope;

        const appointmentsToday = await Appointment.countDocuments(appointmentsTodayQuery);

        const pendingConfirmationsQuery = {
            appointmentDate: { $gte: today, $lt: tomorrow },
            status: { $in: ['scheduled'] },
        };
        if (dentistScope) pendingConfirmationsQuery.dentist = dentistScope;

        const pendingConfirmationsToday = await Appointment.countDocuments(pendingConfirmationsQuery);

        const apptMonthQuery = {
            appointmentDate: { $gte: startOfThisMonth, $lt: startOfNextMonth },
            status: { $nin: ['cancelled', 'no_show', 'no-show'] },
        };
        const apptLastMonthQuery = {
            appointmentDate: { $gte: startOfLastMonth, $lt: startOfThisMonthAgain },
            status: { $nin: ['cancelled', 'no_show', 'no-show'] },
        };
        if (dentistScope) {
            apptMonthQuery.dentist = dentistScope;
            apptLastMonthQuery.dentist = dentistScope;
        }

        const [appointmentsThisMonth, appointmentsLastMonth] = await Promise.all([
            Appointment.countDocuments(apptMonthQuery),
            Appointment.countDocuments(apptLastMonthQuery),
        ]);

        const appointmentsChangeCount = appointmentsThisMonth - appointmentsLastMonth;

        const buildDentistInvoiceIds = async () => {
            if (!dentistScope) return null;
            const [appointmentIds, treatmentIds, labWorkIds, prescriptionIds] = await Promise.all([
                Appointment.find({ dentist: dentistScope }).distinct('_id'),
                Treatment.find({ dentist: dentistScope }).distinct('_id'),
                require('../models/LabWork').find({ dentist: dentistScope }).distinct('_id'),
                require('../models/Prescription').find({ dentist: dentistScope }).distinct('_id'),
            ]);

            const bills = await Billing.find({
                $or: [
                    { appointment: { $in: appointmentIds } },
                    { treatment: { $in: treatmentIds } },
                    { labWork: { $in: labWorkIds } },
                    { prescription: { $in: prescriptionIds } },
                ],
            }).distinct('_id');
            return bills;
        };

        const dentistInvoiceIds = await buildDentistInvoiceIds();

        // Total revenue (this month)
        const revenueAggThisMonth = await Payment.aggregate([
            {
                $match: {
                    paymentDate: { $gte: startOfThisMonth, $lt: startOfNextMonth },
                    status: 'completed',
                    ...(dentistInvoiceIds ? { invoice: { $in: dentistInvoiceIds } } : {})
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const monthlyRevenue = revenueAggThisMonth?.[0]?.total || 0;

        const revenueAggLastMonth = await Payment.aggregate([
            {
                $match: {
                    paymentDate: { $gte: startOfLastMonth, $lt: startOfThisMonthAgain },
                    status: 'completed',
                    ...(dentistInvoiceIds ? { invoice: { $in: dentistInvoiceIds } } : {})
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const lastMonthRevenue = revenueAggLastMonth?.[0]?.total || 0;
        const revenueChangePercent = safePercentDelta(monthlyRevenue, lastMonthRevenue);

        const daysElapsed = Math.max(1, Math.floor((new Date().getTime() - startOfThisMonth.getTime()) / 86400000) + 1);
        const avgDailyRevenue = monthlyRevenue / daysElapsed;

        const treatmentsThisMonthTotalQuery = {
            updatedAt: { $gte: startOfThisMonth, $lt: startOfNextMonth },
            status: { $in: ['completed', 'cancelled'] },
        };
        const treatmentsThisMonthCompletedQuery = {
            updatedAt: { $gte: startOfThisMonth, $lt: startOfNextMonth },
            status: 'completed',
        };
        if (dentistScope) {
            treatmentsThisMonthTotalQuery.dentist = dentistScope;
            treatmentsThisMonthCompletedQuery.dentist = dentistScope;
        }

        const treatmentsThisMonthTotal = await Treatment.countDocuments(treatmentsThisMonthTotalQuery);
        const treatmentsThisMonthCompleted = await Treatment.countDocuments(treatmentsThisMonthCompletedQuery);
        const treatmentSuccessRate = treatmentsThisMonthTotal
            ? (treatmentsThisMonthCompleted / treatmentsThisMonthTotal) * 100
            : null;

        const treatmentsLastMonthTotalQuery = {
            updatedAt: { $gte: startOfLastMonth, $lt: startOfThisMonthAgain },
            status: { $in: ['completed', 'cancelled'] },
        };
        const treatmentsLastMonthCompletedQuery = {
            updatedAt: { $gte: startOfLastMonth, $lt: startOfThisMonthAgain },
            status: 'completed',
        };
        if (dentistScope) {
            treatmentsLastMonthTotalQuery.dentist = dentistScope;
            treatmentsLastMonthCompletedQuery.dentist = dentistScope;
        }

        const treatmentsLastMonthTotal = await Treatment.countDocuments(treatmentsLastMonthTotalQuery);
        const treatmentsLastMonthCompleted = await Treatment.countDocuments(treatmentsLastMonthCompletedQuery);
        const treatmentSuccessRateLastMonth = treatmentsLastMonthTotal
            ? (treatmentsLastMonthCompleted / treatmentsLastMonthTotal) * 100
            : null;
        const treatmentSuccessDelta =
            treatmentSuccessRateLastMonth == null || treatmentSuccessRate == null
                ? null
                : treatmentSuccessRate - treatmentSuccessRateLastMonth;

        // Pending payments
        const pendingBills = await Billing.aggregate([
            {
                $match: {
                    status: { $in: ['sent', 'overdue'] },
                    ...(dentistInvoiceIds ? { _id: { $in: dentistInvoiceIds } } : {})
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
                newPatientsThisMonth,
                newPatientsLastMonth,
                patientsChangeCount: newPatientsThisMonth - newPatientsLastMonth,
                appointmentsToday,
                pendingConfirmationsToday,
                appointmentsThisMonth,
                appointmentsLastMonth,
                appointmentsChangeCount,
                monthlyRevenue,
                lastMonthRevenue,
                revenueChangePercent,
                avgDailyRevenue,
                pendingPayments,
                treatmentSuccessRate,
                treatmentSuccessDelta,
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get recent activities
exports.getRecentActivities = async (req, res, next) => {
    try {
        const query = {};
        if (req.user?.role === 'dentist' && req.user?._id) {
            query.user = req.user._id;
        }

        const activities = await AuditLog.find(query)
            .populate('user', 'firstName lastName')
            .sort({ timestamp: -1 })
            .limit(10);

        const mapped = activities.map((a) => {
            const userName = a.user ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() : '';
            const action = `${a.action} ${a.module}`;
            const description = userName
                ? `${userName} ${String(a.action || '').toLowerCase()} ${a.module}`
                : `${a.module} ${String(a.action || '').toLowerCase()}`;
            return {
                _id: a._id,
                action,
                description,
                timestamp: a.timestamp,
                type: a.action,
            };
        });

        res.status(200).json({
            status: 'success',
            data: { activities: mapped }
        });
    } catch (error) {
        next(error);
    }
};

// Get upcoming appointments
exports.getUpcomingAppointments = async (req, res, next) => {
    try {
        const now = new Date();
        const query = {
            appointmentDate: { $gte: now },
            status: { $in: ['scheduled', 'confirmed'] }
        };

        if (req.user?.role === 'dentist' && req.user?._id) {
            query.dentist = req.user._id;
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName phone')
            .populate('dentist', 'firstName lastName')
            .sort({ appointmentDate: 1 })
            .limit(5);

        const mapped = appointments.map((a) => {
            const obj = a.toObject ? a.toObject() : a;
            return {
                ...obj,
                status: normalizeAppointmentStatus(obj.status),
            };
        });

        res.status(200).json({
            status: 'success',
            data: { appointments: mapped }
        });
    } catch (error) {
        next(error);
    }
};

// Get revenue chart data
exports.getRevenueChart = async (req, res, next) => {
    try {
        const { period = 'year' } = req.query;
        const now = new Date();

        const dentistScope = req.user?.role === 'dentist' && req.user?._id ? req.user._id : null;

        let startDate;
        let keys = [];
        let keyFormat = 'ym';

        if (period === 'week') {
            keyFormat = 'ymd';
            const start = startOfDay(addDays(now, -6));
            startDate = start;
            keys = Array.from({ length: 7 }).map((_, i) => formatYmd(addDays(start, i)));
        } else if (period === 'month') {
            keyFormat = 'ymd';
            const start = startOfDay(addDays(now, -29));
            startDate = start;
            keys = Array.from({ length: 30 }).map((_, i) => formatYmd(addDays(start, i)));
        } else {
            keyFormat = 'ym';
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            start.setMonth(start.getMonth() - 11);
            startDate = start;
            keys = Array.from({ length: 12 }).map((_, i) => formatYm(new Date(start.getFullYear(), start.getMonth() + i, 1)));
        }

        let dentistInvoiceIds = null;
        if (dentistScope) {
            const LabWork = require('../models/LabWork');
            const Prescription = require('../models/Prescription');

            const [appointmentIds, treatmentIds, labWorkIds, prescriptionIds] = await Promise.all([
                Appointment.find({ dentist: dentistScope }).distinct('_id'),
                Treatment.find({ dentist: dentistScope }).distinct('_id'),
                LabWork.find({ dentist: dentistScope }).distinct('_id'),
                Prescription.find({ dentist: dentistScope }).distinct('_id'),
            ]);

            dentistInvoiceIds = await Billing.find({
                $or: [
                    { appointment: { $in: appointmentIds } },
                    { treatment: { $in: treatmentIds } },
                    { labWork: { $in: labWorkIds } },
                    { prescription: { $in: prescriptionIds } },
                ],
            }).distinct('_id');
        }

        const revenueAgg = await Payment.aggregate([
            {
                $match: {
                    paymentDate: { $gte: startDate },
                    status: 'completed',
                    ...(dentistInvoiceIds ? { invoice: { $in: dentistInvoiceIds } } : {})
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: keyFormat === 'ymd' ? '%Y-%m-%d' : '%Y-%m',
                            date: '$paymentDate'
                        }
                    },
                    revenue: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const apptMatch = {
            appointmentDate: { $gte: startDate },
            status: { $nin: ['cancelled', 'no_show', 'no-show'] }
        };
        if (dentistScope) apptMatch.dentist = dentistScope;

        const apptAgg = await Appointment.aggregate([
            {
                $match: apptMatch
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: keyFormat === 'ymd' ? '%Y-%m-%d' : '%Y-%m',
                            date: '$appointmentDate'
                        }
                    },
                    appointments: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const revenueMap = new Map(revenueAgg.map((r) => [r._id, r.revenue]));
        const apptMap = new Map(apptAgg.map((a) => [a._id, a.appointments]));

        const series = keys.map((k) => {
            const d = keyFormat === 'ymd' ? new Date(k) : new Date(`${k}-01`);
            const label =
                keyFormat === 'ym'
                    ? d.toLocaleDateString('en-US', { month: 'short' })
                    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return {
                key: k,
                label,
                revenue: Number(revenueMap.get(k) || 0),
                appointments: Number(apptMap.get(k) || 0),
            };
        });

        res.status(200).json({
            status: 'success',
            data: { series, period }
        });
    } catch (error) {
        next(error);
    }
};

exports.getPatientFlow = async (req, res, next) => {
    try {
        const { period = 'week' } = req.query;
        const now = new Date();

        let startDate;
        let keys = [];

        if (period === 'month') {
            const start = startOfDay(addDays(now, -29));
            startDate = start;
            keys = Array.from({ length: 30 }).map((_, i) => formatYmd(addDays(start, i)));
        } else {
            const start = startOfDay(addDays(now, -6));
            startDate = start;
            keys = Array.from({ length: 7 }).map((_, i) => formatYmd(addDays(start, i)));
        }

        const match = {
            appointmentDate: { $gte: startDate },
            status: { $nin: ['cancelled', 'no_show', 'no-show'] }
        };

        if (req.user?.role === 'dentist' && req.user?._id) {
            match.dentist = req.user._id;
        }

        const apptAgg = await Appointment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' }
                    },
                    checkIns: { $sum: 1 },
                    completions: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['completed']] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const map = new Map(apptAgg.map((a) => [a._id, { checkIns: a.checkIns, completions: a.completions }]));
        const series = keys.map((k) => {
            const d = new Date(k);
            const label = period === 'month'
                ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : d.toLocaleDateString('en-US', { weekday: 'short' });
            const v = map.get(k) || { checkIns: 0, completions: 0 };
            return {
                key: k,
                label,
                checkIns: Number(v.checkIns || 0),
                completions: Number(v.completions || 0),
            };
        });

        res.status(200).json({
            status: 'success',
            data: { series, period },
        });
    } catch (error) {
        next(error);
    }
};

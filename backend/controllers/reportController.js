const Billing = require('../models/Billing');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toDate = (v) => {
    if (!v) return undefined;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return undefined;
    return d;
};

const getRangeFromPeriod = (period) => {
    const p = String(period || 'month').toLowerCase();
    const now = new Date();
    const end = new Date(now);
    let start;

    if (p === 'week') {
        start = new Date(now);
        start.setDate(start.getDate() - 7);
    } else if (p === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
    } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end, period: p };
};

const shiftRangeBack = ({ start, end, period }) => {
    const prevStart = new Date(start);
    const prevEnd = new Date(end);

    if (period === 'week') {
        prevStart.setDate(prevStart.getDate() - 7);
        prevEnd.setDate(prevEnd.getDate() - 7);
    } else if (period === 'year') {
        prevStart.setFullYear(prevStart.getFullYear() - 1);
        prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    } else {
        prevStart.setMonth(prevStart.getMonth() - 1);
        prevEnd.setMonth(prevEnd.getMonth() - 1);
    }

    return { start: prevStart, end: prevEnd, period };
};

const pctChange = (prev, curr) => {
    const p = Number(prev || 0);
    const c = Number(curr || 0);
    if (p <= 0) return c > 0 ? 100 : 0;
    return ((c - p) / p) * 100;
};

exports.getFinancialReport = async (req, res, next) => {
    try {
        const period = req.query.period;
        const startDate = toDate(req.query.startDate);
        const endDate = toDate(req.query.endDate);

        const baseRange = startDate || endDate
            ? { start: startDate || new Date(0), end: endDate || new Date(), period: String(period || 'custom') }
            : getRangeFromPeriod(period);

        const prevRange = (baseRange.period === 'custom') ? undefined : shiftRangeBack(baseRange);

        const paymentMatch = {
            status: 'completed',
            paymentDate: { $gte: baseRange.start, $lte: baseRange.end },
        };
        const expenseMatch = {
            expenseDate: { $gte: baseRange.start, $lte: baseRange.end },
        };
        const billMatch = {
            invoiceDate: { $gte: baseRange.start, $lte: baseRange.end },
            status: { $in: ['pending', 'partially-paid', 'overdue'] },
        };

        const [revenueAgg, expenseAgg, outstandingAgg] = await Promise.all([
            Payment.aggregate([
                { $match: paymentMatch },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Expense.aggregate([
                { $match: expenseMatch },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Billing.aggregate([
                { $match: billMatch },
                {
                    $project: {
                        balance: {
                            $max: [0, { $subtract: ['$total', '$paidAmount'] }],
                        },
                    },
                },
                { $group: { _id: null, total: { $sum: '$balance' } } },
            ]),
        ]);

        const totalRevenue = Number(revenueAgg?.[0]?.total || 0);
        const totalExpenses = Number(expenseAgg?.[0]?.total || 0);
        const paymentsCount = Number(revenueAgg?.[0]?.count || 0);
        const expensesCount = Number(expenseAgg?.[0]?.count || 0);
        const outstanding = Number(outstandingAgg?.[0]?.total || 0);
        const netProfit = totalRevenue - totalExpenses;
        const profitMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const avgPayment = paymentsCount > 0 ? totalRevenue / paymentsCount : 0;

        let revenueChangePct = 0;
        if (prevRange) {
            const prevRevenueAgg = await Payment.aggregate([
                { $match: { status: 'completed', paymentDate: { $gte: prevRange.start, $lte: prevRange.end } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            const prevRevenue = Number(prevRevenueAgg?.[0]?.total || 0);
            revenueChangePct = pctChange(prevRevenue, totalRevenue);
        }

        const chartMonths = baseRange.period === 'year' ? 12 : 6;
        const chartStart = new Date(baseRange.end);
        chartStart.setMonth(chartStart.getMonth() - (chartMonths - 1));
        chartStart.setDate(1);
        chartStart.setHours(0, 0, 0, 0);

        const [revByMonth, expByMonth] = await Promise.all([
            Payment.aggregate([
                {
                    $match: {
                        status: 'completed',
                        paymentDate: { $gte: chartStart, $lte: baseRange.end },
                    },
                },
                {
                    $group: {
                        _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
                        total: { $sum: '$amount' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
            Expense.aggregate([
                { $match: { expenseDate: { $gte: chartStart, $lte: baseRange.end } } },
                {
                    $group: {
                        _id: { year: { $year: '$expenseDate' }, month: { $month: '$expenseDate' } },
                        total: { $sum: '$amount' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
        ]);

        const key = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
        const revMap = new Map(revByMonth.map((r) => [key(r._id.year, r._id.month), Number(r.total || 0)]));
        const expMap = new Map(expByMonth.map((r) => [key(r._id.year, r._id.month), Number(r.total || 0)]));

        const series = [];
        for (let i = 0; i < chartMonths; i += 1) {
            const d = new Date(chartStart.getFullYear(), chartStart.getMonth() + i, 1);
            const k = key(d.getFullYear(), d.getMonth() + 1);
            series.push({
                name: MONTHS[d.getMonth()],
                revenue: revMap.get(k) || 0,
                expenses: expMap.get(k) || 0,
            });
        }

        const [revenueByMethodAgg, expensesByCategoryAgg, invoicesByStatusAgg, recentPayments, recentExpenses, topOutstandingInvoices] = await Promise.all([
            Payment.aggregate([
                { $match: paymentMatch },
                { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } },
            ]),
            Expense.aggregate([
                { $match: expenseMatch },
                { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } },
            ]),
            Billing.aggregate([
                { $match: { invoiceDate: { $gte: baseRange.start, $lte: baseRange.end } } },
                {
                    $project: {
                        status: 1,
                        total: 1,
                        paidAmount: 1,
                        balance: {
                            $max: [0, { $subtract: ['$total', '$paidAmount'] }],
                        },
                    },
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        billed: { $sum: '$total' },
                        paid: { $sum: '$paidAmount' },
                        outstanding: { $sum: '$balance' },
                    },
                },
                { $sort: { count: -1 } },
            ]),
            Payment.find(paymentMatch)
                .sort({ paymentDate: -1 })
                .limit(10)
                .select('paymentId amount paymentDate paymentMethod status transactionId invoice patient')
                .populate('patient', 'firstName lastName')
                .populate('invoice', 'invoiceNumber total paidAmount status')
                .lean(),
            Expense.find(expenseMatch)
                .sort({ expenseDate: -1 })
                .limit(10)
                .select('expenseId category description amount expenseDate vendor paymentMethod paymentStatus')
                .lean(),
            Billing.aggregate([
                { $match: billMatch },
                {
                    $project: {
                        invoiceNumber: 1,
                        patientName: 1,
                        status: 1,
                        invoiceDate: 1,
                        total: 1,
                        paidAmount: 1,
                        balance: {
                            $max: [0, { $subtract: ['$total', '$paidAmount'] }],
                        },
                    },
                },
                { $sort: { balance: -1, invoiceDate: -1 } },
                { $limit: 10 },
            ]),
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                summary: {
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    outstanding,
                    profitMarginPct,
                    revenueChangePct,
                    paymentsCount,
                    expensesCount,
                    avgPayment,
                },
                chart: {
                    revenueVsExpenses: series,
                },
                breakdown: {
                    revenueByMethod: (revenueByMethodAgg || []).map((r) => ({
                        method: r._id,
                        total: Number(r.total || 0),
                        count: Number(r.count || 0),
                    })),
                    expensesByCategory: (expensesByCategoryAgg || []).map((r) => ({
                        category: r._id,
                        total: Number(r.total || 0),
                        count: Number(r.count || 0),
                    })),
                    invoicesByStatus: (invoicesByStatusAgg || []).map((r) => ({
                        status: r._id,
                        count: Number(r.count || 0),
                        billed: Number(r.billed || 0),
                        paid: Number(r.paid || 0),
                        outstanding: Number(r.outstanding || 0),
                    })),
                    topOutstandingInvoices: (topOutstandingInvoices || []).map((inv) => ({
                        invoiceNumber: inv.invoiceNumber,
                        patientName: inv.patientName,
                        status: inv.status,
                        invoiceDate: inv.invoiceDate,
                        total: Number(inv.total || 0),
                        paidAmount: Number(inv.paidAmount || 0),
                        balance: Number(inv.balance || 0),
                    })),
                },
                recent: {
                    payments: Array.isArray(recentPayments) ? recentPayments : [],
                    expenses: Array.isArray(recentExpenses) ? recentExpenses : [],
                },
                range: {
                    start: baseRange.start,
                    end: baseRange.end,
                    period: baseRange.period,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.getClinicalReport = async (req, res, next) => {
    res.status(200).json({ status: 'success', data: { report: 'Clinical report placeholder' } });
};

exports.getPerformanceReport = async (req, res, next) => {
    res.status(200).json({ status: 'success', data: { report: 'Performance report placeholder' } });
};

exports.getDashboardStats = async (req, res, next) => {
    res.status(200).json({ status: 'success', data: { stats: 'Dashboard stats placeholder' } });
};

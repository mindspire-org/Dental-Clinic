const Expense = require('../models/Expense');

// Get all expenses with filtering and pagination
exports.getAllExpenses = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            paymentStatus,
            approvalStatus,
            startDate,
            endDate,
            vendor,
            search
        } = req.query;

        const query = {};

        // Filters
        if (category) query.category = category;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (approvalStatus) query.approvalStatus = approvalStatus;
        if (vendor) query.vendor = new RegExp(vendor, 'i');

        // Date range filter
        if (startDate || endDate) {
            query.expenseDate = {};
            if (startDate) query.expenseDate.$gte = new Date(startDate);
            if (endDate) query.expenseDate.$lte = new Date(endDate);
        }

        // Search in description
        if (search) {
            query.$or = [
                { description: new RegExp(search, 'i') },
                { expenseId: new RegExp(search, 'i') },
                { vendor: new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const expenses = await Expense.find(query)
            .populate('createdBy', 'firstName lastName email')
            .populate('approvedBy', 'firstName lastName email')
            .sort('-expenseDate')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Expense.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                expenses,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get expense by ID
exports.getExpenseById = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email')
            .populate('approvedBy', 'firstName lastName email');

        if (!expense) {
            return res.status(404).json({
                status: 'error',
                message: 'Expense not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { expense }
        });
    } catch (error) {
        next(error);
    }
};

// Create new expense
exports.createExpense = async (req, res, next) => {
    try {
        const expenseData = {
            ...req.body,
            createdBy: req.user?._id || req.body.createdBy
        };

        const expense = await Expense.create(expenseData);
        const populated = await Expense.findById(expense._id)
            .populate('createdBy', 'firstName lastName email');

        res.status(201).json({
            status: 'success',
            data: { expense: populated }
        });
    } catch (error) {
        next(error);
    }
};

// Update expense
exports.updateExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                status: 'error',
                message: 'Expense not found'
            });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                expense[key] = req.body[key];
            }
        });

        await expense.save();

        const updated = await Expense.findById(expense._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('approvedBy', 'firstName lastName email');

        res.status(200).json({
            status: 'success',
            data: { expense: updated }
        });
    } catch (error) {
        next(error);
    }
};

// Delete expense
exports.deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);

        if (!expense) {
            return res.status(404).json({
                status: 'error',
                message: 'Expense not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get expense statistics
exports.getExpenseStats = async (req, res, next) => {
    try {
        const { startDate, endDate, category } = req.query;

        const matchQuery = {};
        if (startDate || endDate) {
            matchQuery.expenseDate = {};
            if (startDate) matchQuery.expenseDate.$gte = new Date(startDate);
            if (endDate) matchQuery.expenseDate.$lte = new Date(endDate);
        }
        if (category) matchQuery.category = category;

        const stats = await Expense.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: '$amount' },
                    totalPaid: { $sum: '$paidAmount' },
                    totalPending: { $sum: { $subtract: ['$amount', '$paidAmount'] } },
                    count: { $sum: 1 },
                    avgExpense: { $avg: '$amount' }
                }
            }
        ]);

        // Monthly breakdown
        const monthlyStats = await Expense.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: '$expenseDate' },
                        month: { $month: '$expenseDate' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                summary: stats[0] || {
                    totalExpenses: 0,
                    totalPaid: 0,
                    totalPending: 0,
                    count: 0,
                    avgExpense: 0
                },
                monthlyBreakdown: monthlyStats
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get category-wise breakdown
exports.getCategoryBreakdown = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const matchQuery = {};
        if (startDate || endDate) {
            matchQuery.expenseDate = {};
            if (startDate) matchQuery.expenseDate.$gte = new Date(startDate);
            if (endDate) matchQuery.expenseDate.$lte = new Date(endDate);
        }

        const breakdown = await Expense.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    paid: { $sum: '$paidAmount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { total: -1 } }
        ]);

        res.status(200).json({
            status: 'success',
            data: { breakdown }
        });
    } catch (error) {
        next(error);
    }
};

// Approve expense
exports.approveExpense = async (req, res, next) => {
    try {
        const { status, notes } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid approval status'
            });
        }

        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                status: 'error',
                message: 'Expense not found'
            });
        }

        expense.approvalStatus = status;
        expense.approvedBy = req.user?._id;
        if (notes) expense.notes = notes;

        await expense.save();

        const updated = await Expense.findById(expense._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('approvedBy', 'firstName lastName email');

        res.status(200).json({
            status: 'success',
            data: { expense: updated }
        });
    } catch (error) {
        next(error);
    }
};

// Get expenses by date range
exports.getExpensesByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Start date and end date are required'
            });
        }

        const expenses = await Expense.find({
            expenseDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
            .populate('createdBy', 'firstName lastName email')
            .populate('approvedBy', 'firstName lastName email')
            .sort('-expenseDate');

        res.status(200).json({
            status: 'success',
            data: { expenses }
        });
    } catch (error) {
        next(error);
    }
};

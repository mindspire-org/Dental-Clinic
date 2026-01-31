const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const protect = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

// CRUD routes
router.route('/')
    .get(expenseController.getAllExpenses)
    .post(expenseController.createExpense);

router.route('/:id')
    .get(expenseController.getExpenseById)
    .put(expenseController.updateExpense)
    .delete(expenseController.deleteExpense);

// Stats and reports
router.get('/stats/summary', expenseController.getExpenseStats);
router.get('/stats/category-breakdown', expenseController.getCategoryBreakdown);
router.get('/stats/date-range', expenseController.getExpensesByDateRange);

// Approval
router.post('/:id/approve', expenseController.approveExpense);

module.exports = router;

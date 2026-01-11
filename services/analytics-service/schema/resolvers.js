const db = require('../utils/db');
const { pubsub, EVENTS } = require('../utils/redis');

// Category colors for charts
const CATEGORY_COLORS = {
    'Food & Dining': '#FF6B6B',
    'Transportation': '#4ECDC4',
    'Shopping': '#45B7D1',
    'Bills & Utilities': '#96CEB4',
    'Entertainment': '#FFEAA7',
    'Healthcare': '#DDA0DD',
    'Education': '#98D8C8',
    'Personal Care': '#F7DC6F',
    'Travel': '#85C1E9',
    'Groceries': '#82E0AA',
    'Salary': '#2ECC71',
    'Business': '#3498DB',
    'Investment': '#9B59B6',
    'Freelance': '#1ABC9C',
    'Gift': '#E74C3C',
    'Other': '#BDC3C7',
};

// Helper to get date range based on period
const getDateRange = (period) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'DAILY':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date();
            break;
        case 'WEEKLY':
            const dayOfWeek = now.getDay();
            startDate = new Date(now.setDate(now.getDate() - dayOfWeek));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            break;
        case 'MONTHLY':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date();
            break;
        case 'YEARLY':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date();
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date();
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
    };
};

const resolvers = {
    Query: {
        hello: () => 'Hello from BudgetWise Analytics!',

        dashboardSummary: async (_, { userId, period }) => {
            const { startDate, endDate } = getDateRange(period);

            const [summary] = await db.query(
                `SELECT 
          type,
          SUM(amount) as total,
          COUNT(*) as count
         FROM transactions 
         WHERE user_id = ? AND date >= ? AND date <= ?
         GROUP BY type`,
                [userId, startDate, endDate]
            );

            let totalIncome = 0;
            let totalExpense = 0;
            let transactionCount = 0;

            summary.forEach(row => {
                if (row.type === 'income') {
                    totalIncome = parseFloat(row.total);
                } else {
                    totalExpense = parseFloat(row.total);
                }
                transactionCount += row.count;
            });

            // Get top expense category
            const [topCat] = await db.query(
                `SELECT category, SUM(amount) as total
         FROM transactions 
         WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
         GROUP BY category
         ORDER BY total DESC
         LIMIT 1`,
                [userId, startDate, endDate]
            );

            const balance = totalIncome - totalExpense;
            const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

            return {
                totalIncome,
                totalExpense,
                balance,
                savingsRate: parseFloat(savingsRate.toFixed(2)),
                topCategory: topCat.length > 0 ? topCat[0].category : null,
                transactionCount,
            };
        },

        spendingByCategory: async (_, { userId, period }) => {
            const { startDate, endDate } = getDateRange(period);

            const [categories] = await db.query(
                `SELECT category, SUM(amount) as total
         FROM transactions 
         WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
         GROUP BY category
         ORDER BY total DESC`,
                [userId, startDate, endDate]
            );

            const totalSpending = categories.reduce((sum, cat) => sum + parseFloat(cat.total), 0);

            return categories.map(cat => ({
                category: cat.category,
                amount: parseFloat(cat.total),
                percentage: totalSpending > 0 ? parseFloat(((cat.total / totalSpending) * 100).toFixed(2)) : 0,
                color: CATEGORY_COLORS[cat.category] || '#BDC3C7',
            }));
        },

        spendingTrend: async (_, { userId, period }) => {
            const { startDate, endDate } = getDateRange(period);

            let dateFormat;
            switch (period) {
                case 'DAILY':
                    dateFormat = '%Y-%m-%d %H:00';
                    break;
                case 'WEEKLY':
                case 'MONTHLY':
                    dateFormat = '%Y-%m-%d';
                    break;
                case 'YEARLY':
                    dateFormat = '%Y-%m';
                    break;
                default:
                    dateFormat = '%Y-%m-%d';
            }

            const [trend] = await db.query(
                `SELECT 
          DATE_FORMAT(date, '${dateFormat}') as period_date,
          type,
          SUM(amount) as total
         FROM transactions 
         WHERE user_id = ? AND date >= ? AND date <= ?
         GROUP BY period_date, type
         ORDER BY period_date`,
                [userId, startDate, endDate]
            );

            // Group by date
            const trendMap = {};
            trend.forEach(row => {
                if (!trendMap[row.period_date]) {
                    trendMap[row.period_date] = { date: row.period_date, income: 0, expense: 0 };
                }
                if (row.type === 'income') {
                    trendMap[row.period_date].income = parseFloat(row.total);
                } else {
                    trendMap[row.period_date].expense = parseFloat(row.total);
                }
            });

            return Object.values(trendMap);
        },

        budgetStatus: async (_, { userId }) => {
            const now = new Date().toISOString().split('T')[0];

            const [budgets] = await db.query(
                `SELECT * FROM budgets 
         WHERE user_id = ? AND start_date <= ? AND end_date >= ?`,
                [userId, now, now]
            );

            const statuses = await Promise.all(budgets.map(async (budget) => {
                const [spentResult] = await db.query(
                    `SELECT COALESCE(SUM(amount), 0) as spent 
           FROM transactions 
           WHERE user_id = ? AND category = ? AND type = 'expense' 
           AND date >= ? AND date <= ?`,
                    [userId, budget.category, budget.start_date, budget.end_date]
                );

                const spent = parseFloat(spentResult[0].spent);
                const limit = parseFloat(budget.amount);
                const percentage = (spent / limit) * 100;

                let status;
                if (percentage >= 100) {
                    status = 'exceeded';
                } else if (percentage >= budget.alert_threshold) {
                    status = 'near_limit';
                } else if (percentage >= 75) {
                    status = 'warning';
                } else {
                    status = 'on_track';
                }

                return {
                    id: budget.id,
                    category: budget.category,
                    budgetAmount: limit,
                    spentAmount: spent,
                    percentage: parseFloat(percentage.toFixed(2)),
                    status,
                };
            }));

            return statuses;
        },

        incomeVsExpense: async (_, { userId, period }) => {
            const { startDate, endDate } = getDateRange(period);

            // Get totals
            const [totals] = await db.query(
                `SELECT type, SUM(amount) as total
         FROM transactions 
         WHERE user_id = ? AND date >= ? AND date <= ?
         GROUP BY type`,
                [userId, startDate, endDate]
            );

            let totalIncome = 0;
            let totalExpense = 0;

            totals.forEach(row => {
                if (row.type === 'income') {
                    totalIncome = parseFloat(row.total);
                } else {
                    totalExpense = parseFloat(row.total);
                }
            });

            // Get by category
            const [byCategory] = await db.query(
                `SELECT type, category, SUM(amount) as total
         FROM transactions 
         WHERE user_id = ? AND date >= ? AND date <= ?
         GROUP BY type, category
         ORDER BY total DESC`,
                [userId, startDate, endDate]
            );

            const incomeByCategory = byCategory
                .filter(row => row.type === 'income')
                .map(row => ({
                    category: row.category,
                    amount: parseFloat(row.total),
                    percentage: totalIncome > 0 ? parseFloat(((row.total / totalIncome) * 100).toFixed(2)) : 0,
                    color: CATEGORY_COLORS[row.category] || '#2ECC71',
                }));

            const expenseByCategory = byCategory
                .filter(row => row.type === 'expense')
                .map(row => ({
                    category: row.category,
                    amount: parseFloat(row.total),
                    percentage: totalExpense > 0 ? parseFloat(((row.total / totalExpense) * 100).toFixed(2)) : 0,
                    color: CATEGORY_COLORS[row.category] || '#BDC3C7',
                }));

            return {
                totalIncome,
                totalExpense,
                incomeByCategory,
                expenseByCategory,
            };
        },
    },

    Subscription: {
        budgetAlertTriggered: {
            subscribe: (_, { userId }) => pubsub.asyncIterator([`${EVENTS.BUDGET_ALERT}:${userId}`]),
        },
        transactionAdded: {
            subscribe: (_, { userId }) => pubsub.asyncIterator([`${EVENTS.TRANSACTION_ADDED}:${userId}`]),
        },
        dashboardUpdated: {
            subscribe: (_, { userId }) => pubsub.asyncIterator([`${EVENTS.DASHBOARD_UPDATED}:${userId}`]),
        },
    },
};

module.exports = resolvers;

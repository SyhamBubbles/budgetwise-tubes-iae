const typeDefs = `#graphql
  enum Period {
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
  }

  type DashboardSummary {
    totalIncome: Float!
    totalExpense: Float!
    balance: Float!
    savingsRate: Float!
    topCategory: String
    transactionCount: Int!
  }

  type CategorySpending {
    category: String!
    amount: Float!
    percentage: Float!
    color: String!
  }

  type TrendData {
    date: String!
    income: Float!
    expense: Float!
  }

  type BudgetStatus {
    id: ID!
    category: String!
    budgetAmount: Float!
    spentAmount: Float!
    percentage: Float!
    status: String!
  }

  type IncomeExpenseData {
    totalIncome: Float!
    totalExpense: Float!
    incomeByCategory: [CategorySpending!]!
    expenseByCategory: [CategorySpending!]!
  }

  type BudgetAlert {
    category: String!
    percentage: Float!
    message: String!
    timestamp: String!
  }

  type Transaction {
    id: ID!
    type: String!
    amount: Float!
    category: String!
    description: String
    date: String!
  }

  type Query {
    hello: String

    # Dashboard summary
    dashboardSummary(userId: ID!, period: Period!): DashboardSummary

    # Spending analysis
    spendingByCategory(userId: ID!, period: Period!): [CategorySpending!]!
    spendingTrend(userId: ID!, period: Period!): [TrendData!]!

    # Budget status
    budgetStatus(userId: ID!): [BudgetStatus!]!

    # Income vs Expense
    incomeVsExpense(userId: ID!, period: Period!): IncomeExpenseData
  }

  type Subscription {
    # Real-time updates
    budgetAlertTriggered(userId: ID!): BudgetAlert!
    transactionAdded(userId: ID!): Transaction!
    dashboardUpdated(userId: ID!): DashboardSummary!
  }
`;

module.exports = typeDefs;

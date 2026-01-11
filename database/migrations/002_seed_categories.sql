-- Seed Categories
-- BudgetWise Default Categories

-- Expense Categories
INSERT INTO categories (id, name, type, icon, color) VALUES
(UUID(), 'Food & Dining', 'expense', '🍔', '#FF6B6B'),
(UUID(), 'Transportation', 'expense', '🚗', '#4ECDC4'),
(UUID(), 'Shopping', 'expense', '🛍️', '#45B7D1'),
(UUID(), 'Bills & Utilities', 'expense', '💡', '#96CEB4'),
(UUID(), 'Entertainment', 'expense', '🎬', '#FFEAA7'),
(UUID(), 'Healthcare', 'expense', '🏥', '#DDA0DD'),
(UUID(), 'Education', 'expense', '📚', '#98D8C8'),
(UUID(), 'Personal Care', 'expense', '💅', '#F7DC6F'),
(UUID(), 'Travel', 'expense', '✈️', '#85C1E9'),
(UUID(), 'Groceries', 'expense', '🛒', '#82E0AA'),
(UUID(), 'Other Expense', 'expense', '📦', '#BDC3C7');

-- Income Categories
INSERT INTO categories (id, name, type, icon, color) VALUES
(UUID(), 'Salary', 'income', '💰', '#2ECC71'),
(UUID(), 'Business', 'income', '💼', '#3498DB'),
(UUID(), 'Investment', 'income', '📈', '#9B59B6'),
(UUID(), 'Freelance', 'income', '💻', '#1ABC9C'),
(UUID(), 'Gift', 'income', '🎁', '#E74C3C'),
(UUID(), 'Other Income', 'income', '💵', '#F39C12');

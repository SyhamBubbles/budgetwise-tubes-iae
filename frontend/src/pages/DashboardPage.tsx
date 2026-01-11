import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Wallet, TrendingUp } from "lucide-react";
import { transactionService } from "@/services/transactionService";

interface CategorySummary {
    category: string;
    type: string;
    total: string | number;
    count: number;
}

export default function DashboardPage() {
    const { data: summary, isLoading } = useQuery({
        queryKey: ["monthlySummary"],
        queryFn: () => transactionService.getMonthlySummary(),
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Use correct field names from API: income, expense (not total_income, total_expense)
    const totalIncome = summary?.income ?? 0;
    const totalExpense = summary?.expense ?? 0;
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

    // Filter expense categories for display
    const expenseCategories = (summary?.by_category || [])
        .filter((cat: CategorySummary) => cat.type === 'expense')
        .slice(0, 5);

    const stats = [
        {
            title: "Total Balance",
            value: formatCurrency(balance),
            icon: Wallet,
            description: "Current month balance",
            color: balance >= 0 ? "text-green-600" : "text-red-600"
        },
        {
            title: "Income",
            value: formatCurrency(totalIncome),
            icon: DollarSign,
            description: `${summary?.income_count ?? 0} transactions`,
            color: "text-green-600"
        },
        {
            title: "Expenses",
            value: formatCurrency(totalExpense),
            icon: CreditCard,
            description: `${summary?.expense_count ?? 0} transactions`,
            color: "text-red-600"
        },
        {
            title: "Savings Rate",
            value: `${savingsRate}%`,
            icon: TrendingUp,
            description: balance >= 0 ? "On track!" : "Over budget",
            color: Number(savingsRate) >= 20 ? "text-green-600" : "text-yellow-600"
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                                <>
                                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stat.description}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Top Spending Categories */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
                            ))}
                        </div>
                    ) : expenseCategories.length > 0 ? (
                        <div className="space-y-3">
                            {expenseCategories.map((cat: CategorySummary, i: number) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="text-sm">{cat.category}</span>
                                    <span className="font-medium text-red-600">
                                        {formatCurrency(Number(cat.total))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No expenses yet. Start tracking your spending!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { transactionService } from "@/services/transactionService";
import { cn } from "@/lib/utils";

// Categories by type
const expenseCategories = [
    { group: "Essentials", items: ["Food & Dining", "Transportation", "Bills & Utilities", "Healthcare"] },
    { group: "Lifestyle", items: ["Shopping", "Entertainment"] },
];

const incomeCategories = [
    { group: "Income", items: ["Salary", "Business", "Investment", "Freelance", "Other Income"] },
];

// Form Schema
const transactionSchema = z.object({
    type: z.enum(["income", "expense"]),
    amount: z.string().min(1, "Amount is required"),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    payment_method: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    // Queries
    const { data: transactions, isLoading } = useQuery({
        queryKey: ["transactions"],
        queryFn: () => transactionService.getTransactions(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: transactionService.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setIsDialogOpen(false);
            form.reset();
        },
    });

    // Form
    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: "expense",
            amount: "",
            category: "",
            description: "",
            date: new Date().toISOString().split("T")[0],
            payment_method: "Cash",
        },
    });

    // Watch the type field to filter categories
    const selectedType = useWatch({ control: form.control, name: "type" });

    // Reset category when type changes
    const handleTypeChange = (val: "income" | "expense") => {
        form.setValue("type", val);
        form.setValue("category", ""); // Reset category when type changes
    };

    const onSubmit = (data: TransactionFormValues) => {
        createMutation.mutate({
            ...data,
            amount: parseFloat(data.amount),
        });
    };

    // Get categories based on selected type
    const currentCategories = selectedType === "income" ? incomeCategories : expenseCategories;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-muted-foreground">
                        Manage your daily incomes and expenses.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Transaction
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add Transaction</DialogTitle>
                            <DialogDescription>
                                Record a new income or expense.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        onValueChange={handleTypeChange}
                                        defaultValue={form.getValues("type")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="expense">Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0"
                                        {...form.register("amount")}
                                    />
                                    {form.formState.errors.amount && (
                                        <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    onValueChange={(val) => form.setValue("category", val)}
                                    value={form.watch("category")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentCategories.map((group) => (
                                            <SelectGroup key={group.group}>
                                                <SelectLabel>{group.group}</SelectLabel>
                                                {group.items.map((item) => (
                                                    <SelectItem key={item} value={item}>
                                                        {item}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.category && (
                                    <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    {...form.register("date")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input
                                    id="description"
                                    placeholder="Lunch with friends"
                                    {...form.register("description")}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "Saving..." : "Save Transaction"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 md:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search transactions..."
                        className="pl-8"
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* Transactions List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-4">Loading transactions...</div>
                    ) : transactions?.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No transactions found. Add one to get started.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions?.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="space-y-1">
                                        <p className="font-medium leading-none">{t.category}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t.description || t.category} • {format(new Date(t.date), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "font-bold",
                                        t.type === "income" ? "text-green-600" : "text-red-600"
                                    )}>
                                        {t.type === "income" ? "+" : "-"}
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                        }).format(t.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

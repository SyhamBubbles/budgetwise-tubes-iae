import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash, Calendar, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { differenceInDays, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { budgetService } from "@/services/budgetService";
import { cn } from "@/lib/utils";

// Form Schema
const budgetSchema = z.object({
    category: z.string().min(1, "Category is required"),
    amount: z.string().min(1, "Amount is required"),
    period: z.enum(["monthly", "weekly"]),
    alert_threshold: z.number().optional(),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

// Helper function to calculate remaining days
const getRemainingDays = (endDate: string): number => {
    const end = parseISO(endDate);
    const today = new Date();
    const days = differenceInDays(end, today);
    return Math.max(0, days);
};

export default function BudgetsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: budgets, isLoading } = useQuery({
        queryKey: ["budgets"],
        queryFn: budgetService.getBudgets,
    });

    const createMutation = useMutation({
        mutationFn: budgetService.createBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            setIsDialogOpen(false);
            form.reset();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: budgetService.deleteBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
        },
    });

    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(budgetSchema),
        defaultValues: {
            category: "",
            amount: "",
            period: "monthly",
            alert_threshold: 80,
        },
    });

    const onSubmit = (data: BudgetFormValues) => {
        // Calculate start and end dates based on period
        const now = new Date();
        let start_date: string;
        let end_date: string;

        if (data.period === "monthly") {
            start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        } else {
            // Weekly - start from current week's Monday
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(now.setDate(diff));
            start_date = monday.toISOString().split('T')[0];
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            end_date = sunday.toISOString().split('T')[0];
        }

        createMutation.mutate({
            category: data.category,
            amount: parseFloat(data.amount),
            period: data.period,
            start_date,
            end_date,
            alert_threshold: data.alert_threshold,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
                    <p className="text-muted-foreground">
                        Monitor your spending against your goals.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Budget
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Budget</DialogTitle>
                            <DialogDescription>
                                Set a spending limit for a category.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    onValueChange={(val) => form.setValue("category", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Essentials</SelectLabel>
                                            <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                                            <SelectItem value="Transportation">Transportation</SelectItem>
                                            <SelectItem value="Bills & Utilities">Bills & Utilities</SelectItem>
                                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                                            <SelectItem value="Shopping">Shopping</SelectItem>
                                            <SelectItem value="Entertainment">Entertainment</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.category && (
                                    <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount Limit</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="e.g. 500000"
                                    {...form.register("amount")}
                                />
                                {form.formState.errors.amount && (
                                    <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Period</Label>
                                <Select
                                    onValueChange={(val) => form.setValue("period", val as any)}
                                    defaultValue="monthly"
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "Creating..." : "Create Budget"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div>Loading budgets...</div>
                ) : budgets?.map((budget) => {
                    const spent = budget.spent ?? 0;
                    const percentage = Math.min((spent / budget.amount) * 100, 100);
                    const isOverBudget = spent > budget.amount;
                    const isNearLimit = percentage >= (budget.alert_threshold || 80);
                    const remainingDays = budget.end_date ? getRemainingDays(budget.end_date) : 0;

                    return (
                        <Card key={budget.id} className="relative">
                            {/* Period Badge */}
                            <div className="absolute top-3 right-3">
                                <span className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                    budget.period === "weekly"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                                )}>
                                    <Calendar className="h-3 w-3" />
                                    {budget.period === "weekly" ? "Weekly" : "Monthly"}
                                </span>
                            </div>

                            <CardHeader className="flex flex-row items-start justify-between pb-2 pr-24">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-medium">
                                        {budget.category}
                                    </CardTitle>
                                    <CardDescription>
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                            maximumFractionDigits: 0
                                        }).format(spent)}
                                        {" / "}
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                            maximumFractionDigits: 0
                                        }).format(budget.amount)}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive absolute top-12 right-3"
                                    onClick={() => deleteMutation.mutate(budget.id)}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Progress
                                    value={percentage}
                                    className={cn(
                                        "h-2",
                                        isOverBudget ? "bg-red-200" : isNearLimit ? "bg-yellow-200" : ""
                                    )}
                                />
                                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{remainingDays} days left</span>
                                    </div>
                                    <div>
                                        {percentage.toFixed(1)}% used
                                        {isOverBudget && <span className="text-red-500 font-bold ml-1">(Over Budget!)</span>}
                                        {!isOverBudget && isNearLimit && <span className="text-yellow-600 font-bold ml-1">(Near Limit)</span>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

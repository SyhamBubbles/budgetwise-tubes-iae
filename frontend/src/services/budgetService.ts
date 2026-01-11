import api from './api';
import type { Budget, CreateBudgetDTO } from "@/types/budget";

interface BudgetsResponse {
    success: boolean;
    data: Budget[];
}

interface BudgetResponse {
    success: boolean;
    data: Budget;
    message?: string;
}

interface BudgetStatusResponse {
    success: boolean;
    data: {
        summary: {
            total_budget: number;
            total_spent: number;
            total_remaining: number;
            overall_percentage: number;
            over_budget_count: number;
            near_limit_count: number;
        };
        budgets: Budget[];
    };
}

interface BudgetAlertsResponse {
    success: boolean;
    data: Array<{
        budget_id: string;
        category: string;
        limit: number;
        spent: number;
        percentage: string;
        alert_type: 'over_budget' | 'near_limit';
        message: string;
    }>;
}

export const budgetService = {
    getBudgets: async (): Promise<Budget[]> => {
        const response = await api.get<BudgetsResponse>('/api/budgets');
        return response.data.data;
    },

    getBudget: async (id: string): Promise<Budget> => {
        const response = await api.get<BudgetResponse>(`/api/budgets/${id}`);
        return response.data.data;
    },

    createBudget: async (data: CreateBudgetDTO): Promise<Budget> => {
        const response = await api.post<BudgetResponse>('/api/budgets', data);
        return response.data.data;
    },

    updateBudget: async (id: string, data: Partial<CreateBudgetDTO>): Promise<Budget> => {
        const response = await api.put<BudgetResponse>(`/api/budgets/${id}`, data);
        return response.data.data;
    },

    deleteBudget: async (id: string): Promise<void> => {
        await api.delete(`/api/budgets/${id}`);
    },

    getBudgetStatus: async (): Promise<BudgetStatusResponse['data']> => {
        const response = await api.get<BudgetStatusResponse>('/api/budgets/status');
        return response.data.data;
    },

    getBudgetAlerts: async (): Promise<BudgetAlertsResponse['data']> => {
        const response = await api.get<BudgetAlertsResponse>('/api/budgets/alerts');
        return response.data.data;
    },
};

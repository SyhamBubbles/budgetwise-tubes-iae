import api from './api';
import type { Transaction, CreateTransactionDTO, TransactionFilters } from "@/types/transaction";

interface TransactionsResponse {
    success: boolean;
    data: Transaction[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}

interface TransactionResponse {
    success: boolean;
    data: Transaction;
    message?: string;
}

export const transactionService = {
    getTransactions: async (filters?: TransactionFilters): Promise<Transaction[]> => {
        const params = new URLSearchParams();

        if (filters?.type) params.append('type', filters.type);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.startDate) params.append('start_date', filters.startDate);
        if (filters?.endDate) params.append('end_date', filters.endDate);

        const response = await api.get<TransactionsResponse>(`/api/transactions?${params}`);
        return response.data.data;
    },

    getTransaction: async (id: string): Promise<Transaction> => {
        const response = await api.get<TransactionResponse>(`/api/transactions/${id}`);
        return response.data.data;
    },

    createTransaction: async (data: CreateTransactionDTO): Promise<Transaction> => {
        const response = await api.post<TransactionResponse>('/api/transactions', data);
        return response.data.data;
    },

    updateTransaction: async (id: string, data: Partial<CreateTransactionDTO>): Promise<Transaction> => {
        const response = await api.put<TransactionResponse>(`/api/transactions/${id}`, data);
        return response.data.data;
    },

    deleteTransaction: async (id: string): Promise<void> => {
        await api.delete(`/api/transactions/${id}`);
    },

    getDailySummary: async (date?: string) => {
        const params = date ? `?date=${date}` : '';
        const response = await api.get(`/api/transactions/summary/daily${params}`);
        return response.data.data;
    },

    getMonthlySummary: async (year?: number, month?: number) => {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());

        const response = await api.get(`/api/transactions/summary/monthly?${params}`);
        return response.data.data;
    },

    getCategories: async (type?: 'income' | 'expense') => {
        const params = type ? `?type=${type}` : '';
        const response = await api.get(`/api/categories${params}`);
        return response.data.data;
    },
};

export type TransactionType = "income" | "expense";

export interface Transaction {
    id: string;
    user_id: string;
    room_id?: string | null;
    type: TransactionType;
    amount: number;
    category: string;
    description?: string;
    payment_method?: string;
    date: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTransactionDTO {
    type: TransactionType;
    amount: number;
    category: string;
    description?: string;
    payment_method?: string;
    date: string;
    room_id?: string;
}

export interface TransactionFilters {
    startDate?: string;
    endDate?: string;
    type?: TransactionType;
    category?: string;
}

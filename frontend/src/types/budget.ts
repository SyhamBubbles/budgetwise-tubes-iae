export interface Budget {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    spent?: number; // Calculated field from API
    remaining?: number; // Calculated field
    percentage?: number; // Calculated field
    status?: 'on_track' | 'warning' | 'near_limit' | 'exceeded';
    period: "monthly" | "weekly" | "yearly";
    start_date: string;
    end_date: string;
    alert_threshold: number;
    created_at: string;
    updated_at: string;
}

export interface CreateBudgetDTO {
    category: string;
    amount: number;
    period: "monthly" | "weekly";
    start_date: string;
    end_date: string;
    alert_threshold?: number;
}

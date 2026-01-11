import api from './api';

export interface Notification {
    id: string;
    user_id: string;
    type: 'room_invite' | 'join_request' | 'join_accepted' | 'join_rejected' | 'member_joined' | 'member_left' | 'budget_alert' | 'transaction_added' | 'system';
    title: string;
    message: string;
    related_id?: string;
    related_type?: string;
    action_url?: string;
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

interface NotificationsResponse {
    success: boolean;
    data: Notification[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}

interface UnreadCountResponse {
    success: boolean;
    data: {
        unread_count: number;
    };
}

export const notificationService = {
    getNotifications: async (params?: { type?: string; is_read?: boolean; limit?: number; offset?: number }): Promise<Notification[]> => {
        const queryParams = new URLSearchParams();
        if (params?.type) queryParams.append('type', params.type);
        if (params?.is_read !== undefined) queryParams.append('is_read', String(params.is_read));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.offset) queryParams.append('offset', String(params.offset));

        const url = `/api/notifications${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await api.get<NotificationsResponse>(url);
        return response.data.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await api.get<UnreadCountResponse>('/api/notifications/unread');
        return response.data.data.unread_count;
    },

    markAsRead: async (id: string): Promise<void> => {
        await api.put(`/api/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        await api.put('/api/notifications/read-all');
    },

    deleteNotification: async (id: string): Promise<void> => {
        await api.delete(`/api/notifications/${id}`);
    },

    deleteAllNotifications: async (): Promise<void> => {
        await api.delete('/api/notifications');
    },
};

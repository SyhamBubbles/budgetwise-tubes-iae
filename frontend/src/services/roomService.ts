import api from './api';
import type { Room, CreateRoomDTO, JoinRoomDTO, RoomMember } from "@/types/room";
import type { Transaction } from "@/types/transaction";

interface RoomsResponse {
    success: boolean;
    data: Room[];
}

interface RoomResponse {
    success: boolean;
    data: Room;
    message?: string;
}

interface RoomMembersResponse {
    success: boolean;
    data: RoomMember[];
}

interface RoomTransactionsResponse {
    success: boolean;
    data: (Transaction & { user_name: string })[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}

export interface JoinRequest {
    id: string;
    room_id: string;
    user_id: string;
    role: string;
    status: 'pending';
    name: string;
    email: string;
    created_at: string;
}

interface JoinRequestsResponse {
    success: boolean;
    data: JoinRequest[];
}

export const roomService = {
    getRooms: async (): Promise<Room[]> => {
        const response = await api.get<RoomsResponse>('/api/rooms');
        return response.data.data;
    },

    getRoom: async (id: string): Promise<Room> => {
        const response = await api.get<RoomResponse>(`/api/rooms/${id}`);
        return response.data.data;
    },

    createRoom: async (data: CreateRoomDTO): Promise<Room> => {
        const response = await api.post<RoomResponse>('/api/rooms', data);
        return response.data.data;
    },

    updateRoom: async (id: string, data: Partial<CreateRoomDTO>): Promise<Room> => {
        const response = await api.put<RoomResponse>(`/api/rooms/${id}`, data);
        return response.data.data;
    },

    deleteRoom: async (id: string): Promise<void> => {
        await api.delete(`/api/rooms/${id}`);
    },

    joinRoom: async (data: JoinRoomDTO): Promise<Room> => {
        const response = await api.post<RoomResponse>('/api/rooms/join', data);
        return response.data.data;
    },

    leaveRoom: async (id: string): Promise<void> => {
        await api.post(`/api/rooms/${id}/leave`);
    },

    getRoomMembers: async (id: string): Promise<RoomMember[]> => {
        const response = await api.get<RoomMembersResponse>(`/api/rooms/${id}/members`);
        return response.data.data;
    },

    getRoomTransactions: async (id: string): Promise<(Transaction & { user_name: string })[]> => {
        const response = await api.get<RoomTransactionsResponse>(`/api/rooms/${id}/transactions`);
        return response.data.data;
    },

    addRoomTransaction: async (roomId: string, data: {
        type: 'income' | 'expense';
        amount: number;
        category: string;
        description?: string;
        payment_method?: string;
        date: string;
    }): Promise<Transaction> => {
        const response = await api.post(`/api/rooms/${roomId}/transactions`, data);
        return response.data.data;
    },

    // Join Request Management
    getJoinRequests: async (roomId: string): Promise<JoinRequest[]> => {
        const response = await api.get<JoinRequestsResponse>(`/api/rooms/${roomId}/join-requests`);
        return response.data.data;
    },

    acceptJoinRequest: async (roomId: string, userId: string): Promise<void> => {
        await api.put(`/api/rooms/${roomId}/members/${userId}/accept`);
    },

    rejectJoinRequest: async (roomId: string, userId: string): Promise<void> => {
        await api.put(`/api/rooms/${roomId}/members/${userId}/reject`);
    },

    // Patungan (Contribution) Management
    contribute: async (roomId: string, amount: number): Promise<{ contribution_amount: number; total_collected: number; target_amount: number }> => {
        const response = await api.put(`/api/rooms/${roomId}/contribute`, { amount });
        return response.data.data;
    },

    updateTarget: async (roomId: string, target_amount: number): Promise<void> => {
        await api.put(`/api/rooms/${roomId}/target`, { target_amount });
    },
};



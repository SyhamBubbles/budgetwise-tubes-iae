export type RoomRole = "owner" | "admin" | "member";
export type RoomStatus = "pending" | "active" | "rejected" | "left";

export interface RoomMember {
    id: string;
    room_id: string;
    user_id: string;
    role: RoomRole;
    status: RoomStatus;
    invited_by?: string;
    joined_at?: string;
    contribution_amount?: number; // For patungan feature
    name?: string; // From JOIN with users table
    email?: string; // From JOIN with users table
    user?: {
        name: string;
        email: string;
    };
}

export interface Room {
    id: string;
    name: string;
    description?: string;
    room_code: string;
    owner_id: string;
    target_amount?: number; // Patungan target
    total_collected?: number; // Total contributions
    my_contribution?: number; // Current user's contribution
    created_at: string;
    updated_at: string;
    members_count: number;
    member_count?: number; // Alternative property name from API
    user_role?: RoomRole; // Current user's role
    role?: RoomRole; // Alternative property name from API
}

export interface CreateRoomDTO {
    name: string;
    description?: string;
    target_amount?: number;
}

export interface JoinRoomDTO {
    room_code: string;
}

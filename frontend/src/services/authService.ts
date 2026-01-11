import api from './api';

export interface User {
    id: string;
    email: string;
    name: string;
    currency: string;
    monthly_income: number | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    currency?: string;
    monthly_income?: number;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        accessToken: string;
        refreshToken: string;
    };
}

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/login', credentials);
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens and user
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/register', data);
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens and user
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    },

    logout: async (): Promise<void> => {
        const refreshToken = localStorage.getItem('refreshToken');
        try {
            await api.post('/api/auth/logout', { refreshToken });
        } catch (error) {
            // Continue with local logout even if API fails
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('accessToken');
    },

    getProfile: async (): Promise<User> => {
        const response = await api.get('/api/users/profile');
        return response.data.data;
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await api.put('/api/users/profile', data);
        const user = response.data.data;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },
};

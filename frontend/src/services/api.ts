/**
 * API Client Configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    confirm_password: string;
    full_name?: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface User {
    id: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    last_login?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || `HTTP error ${response.status}`);
        }
        return response.json();
    }

    // Auth endpoints
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return this.handleResponse<AuthResponse>(response);
    }

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return this.handleResponse<AuthResponse>(response);
    }

    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        return this.handleResponse<AuthResponse>(response);
    }

    async getCurrentUser(): Promise<User> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<User>(response);
    }

    async logout(): Promise<void> {
        // Clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
}

export const apiClient = new ApiClient(API_BASE_URL);

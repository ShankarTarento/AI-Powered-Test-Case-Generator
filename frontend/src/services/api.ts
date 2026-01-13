/**
 * API Client Configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type UserRole = 'admin' | 'qa';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    confirm_password: string;
    full_name?: string;
    organization_name: string;
}

export interface Organization {
    id: string;
    name: string;
    created_at: string;
}

export interface User {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
    is_active: boolean;
    is_verified: boolean;
    must_change_password: boolean;
    organization?: Organization;
    created_at: string;
    last_login?: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    jira_project_key?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    member_count?: number;
}

export interface ProjectMember {
    id: string;
    email: string;
    full_name?: string;
    role: string;
    added_at: string;
}

export interface ProjectDetail extends Project {
    members: ProjectMember[];
}

export interface ProjectCreateRequest {
    name: string;
    description?: string;
    jira_project_key?: string;
}

export interface InviteMemberRequest {
    email: string;
    full_name?: string;
}

export interface PasswordChangeRequest {
    current_password: string;
    new_password: string;
    confirm_password: string;
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

    async changePassword(data: PasswordChangeRequest): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/change-password`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to change password' }));
            throw new Error(error.detail);
        }
    }

    async logout(): Promise<void> {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    // Project endpoints
    async getProjects(): Promise<Project[]> {
        const response = await fetch(`${this.baseUrl}/api/v1/projects`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<Project[]>(response);
    }

    async getProject(id: string): Promise<ProjectDetail> {
        const response = await fetch(`${this.baseUrl}/api/v1/projects/${id}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<ProjectDetail>(response);
    }

    async createProject(data: ProjectCreateRequest): Promise<Project> {
        const response = await fetch(`${this.baseUrl}/api/v1/projects`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return this.handleResponse<Project>(response);
    }

    async updateProject(id: string, data: Partial<ProjectCreateRequest>): Promise<Project> {
        const response = await fetch(`${this.baseUrl}/api/v1/projects/${id}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return this.handleResponse<Project>(response);
    }

    async deleteProject(id: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/v1/projects/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to delete project' }));
            throw new Error(error.detail);
        }
    }

    async inviteProjectMember(projectId: string, data: InviteMemberRequest): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/v1/projects/${projectId}/members`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to invite member' }));
            throw new Error(error.detail);
        }
    }

    async removeProjectMember(projectId: string, userId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/v1/projects/${projectId}/members/${userId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to remove member' }));
            throw new Error(error.detail);
        }
    }

    // User management (Admin)
    async getAllUsers(): Promise<User[]> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/users`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<User[]>(response);
    }

    async updateUserRole(userId: string, role: UserRole): Promise<User> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/users/${userId}/role`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ role }),
        });
        return this.handleResponse<User>(response);
    }


    // Feature Endpoints
    async getProjectFeatures(projectId: string): Promise<Feature[]> {
        const url = `${this.baseUrl}/api/v1/projects/${projectId}/features`;

        const response = await fetch(url, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<Feature[]>(response);
    }

    async createFeature(projectId: string, data: FeatureCreateRequest): Promise<Feature> {
        const response = await fetch(`${this.baseUrl}/api/v1/projects/${projectId}/features`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return this.handleResponse<Feature>(response);
    }

    async getUserStory(storyId: string): Promise<UserStory> {
        const response = await fetch(`${this.baseUrl}/api/v1/stories/${storyId}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<UserStory>(response);
    }

    async updateFeature(featureId: string, data: Partial<FeatureCreateRequest>): Promise<Feature> {
        const response = await fetch(`${this.baseUrl}/api/v1/features/${featureId}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return this.handleResponse<Feature>(response);
    }

    // Test Case Endpoints
    async getFeatureTestCases(featureId: string): Promise<TestCase[]> {
        const response = await fetch(`${this.baseUrl}/api/v1/features/${featureId}/test-cases`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<TestCase[]>(response);
    }

    async getJiraStatus(): Promise<{ is_connected: boolean; site_name: string | null }> {
        const response = await fetch(`${this.baseUrl}/api/v1/jira/status`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse(response);
    }

    async getJiraConnectUrl(): Promise<{ url: string }> {
        const response = await fetch(`${this.baseUrl}/api/v1/jira/connect`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse(response);
    }

    async syncJiraFeatures(projectId: string): Promise<{ message: string; count: number }> {
        const response = await fetch(`${this.baseUrl}/api/v1/jira/sync/${projectId}`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse(response);
    }

    async importByJiraKey(projectId: string, jiraKey: string): Promise<ImportResult> {
        const response = await fetch(`${this.baseUrl}/api/v1/jira/import/${projectId}?jira_key=${encodeURIComponent(jiraKey)}`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse(response);
    }

    async generateTestCases(featureId: string): Promise<TestCase[]> {
        const response = await fetch(`${this.baseUrl}/api/v1/features/${featureId}/generate-test-cases`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<TestCase[]>(response);
    }

    async bulkGenerateTestCases(epicId: string): Promise<BulkGenerateResult> {
        const response = await fetch(`${this.baseUrl}/api/v1/epics/${epicId}/bulk-generate-test-cases`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<BulkGenerateResult>(response);
    }
}


export interface BulkGenerateResult {
    total_stories: number;
    stories_processed: number;
    test_cases_generated: number;
    stories: Array<{
        id: string;
        jira_key: string;
        name: string;
        status: 'generated' | 'skipped';
        test_cases_created?: number;
        reason?: string;
    }>;
}


export interface UserStory {
    id: string;
    name: string;
    description?: string;
    epic_id?: string;
    jira_key?: string;
    jira_type: 'epic' | 'story' | 'bug' | 'task';
    jira_status?: string;
    created_at: string;
    children?: UserStory[];
}

// Alias for backward compatibility
export type Feature = UserStory;

export interface FeatureCreateRequest {
    name: string;
    description?: string;
    epic_id?: string;
    jira_key?: string;
    jira_type?: string;
}

export interface ImportResult {
    message: string;
    user_story: {
        id: string;
        name: string;
        type: string;
        jira_key: string;
    };
    children: string[];
    imported_count: number;
}

export interface TestCaseStep {
    step_number: number;
    action: string;
    expected_result: string;
}

export interface TestCase {
    id: string;
    title: string;
    description?: string;
    steps?: TestCaseStep[];
    expected_result?: string;
    priority: 'high' | 'medium' | 'low';
    test_type: string;
    status: 'draft' | 'active' | 'passed' | 'failed' | 'skipped';
    created_at: string;
}


export const apiClient = new ApiClient(API_BASE_URL);

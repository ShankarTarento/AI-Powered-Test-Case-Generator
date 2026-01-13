import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { colors } from '../theme';

export default function Settings() {
    const { user, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    // AI Settings State
    const [aiProvider, setAiProvider] = useState('openai');
    const [aiApiKey, setAiApiKey] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [customModel, setCustomModel] = useState('');
    const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [aiSaving, setAiSaving] = useState(false);
    const [aiTesting, setAiTesting] = useState(false);
    const [aiBaseUrl, setAiBaseUrl] = useState('');

    const PROVIDER_MODELS: Record<string, string[]> = {
        openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
        google: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-pro']
    };

    // Load AI preferences on mount
    useEffect(() => {
        const loadAIConfig = async () => {
            try {
                const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_BASE}/api/v1/ai/providers`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.preferred_provider) setAiProvider(data.preferred_provider);
                    if (data.preferred_model) {
                        const models = PROVIDER_MODELS[data.preferred_provider] || [];
                        if (models.includes(data.preferred_model)) {
                            setAiModel(data.preferred_model);
                        } else {
                            setAiModel('custom');
                            setCustomModel(data.preferred_model);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load AI config', err);
            }
        };
        if (isAdmin) loadAIConfig();
    }, [isAdmin]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        try {
            await apiClient.changePassword({
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword,
                confirm_password: passwordData.confirmPassword
            });
            setPasswordSuccess('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiApiKey) return;
        setAiSaving(true);
        setAiMessage(null);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const selectedModel = aiModel === 'custom' ? customModel : aiModel;
            const response = await fetch(`${API_BASE}/api/v1/ai/configure`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ provider: aiProvider, api_key: aiApiKey, model: selectedModel })
            });
            if (response.ok) {
                setAiMessage({ type: 'success', text: `${aiProvider} API key saved successfully!` });
                setAiApiKey('');
            } else {
                const err = await response.json();
                setAiMessage({ type: 'error', text: err.detail || 'Failed to save' });
            }
        } catch {
            setAiMessage({ type: 'error', text: 'Network error' });
        } finally {
            setAiSaving(false);
        }
    };

    const handleTestAI = async () => {
        if (!aiApiKey) return;
        setAiTesting(true);
        setAiMessage(null);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const selectedModel = aiModel === 'custom' ? customModel : aiModel;
            const response = await fetch(`${API_BASE}/api/v1/ai/test-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    provider: aiProvider,
                    api_key: aiApiKey,
                    model: selectedModel,
                    base_url: aiProvider === 'litellm' ? aiBaseUrl : undefined
                })
            });
            const data = await response.json();
            if (data.success) {
                setAiMessage({ type: 'success', text: data.message || 'Connection successful!' });
            } else {
                setAiMessage({ type: 'error', text: data.message || 'Test failed' });
            }
        } catch {
            setAiMessage({ type: 'error', text: 'Network error during test' });
        } finally {
            setAiTesting(false);
        }
    };

    // Tabs based on role
    const tabs = [
        { id: 'profile', label: 'Profile' },
        { id: 'security', label: 'Security' },
        { id: 'jira', label: 'Jira Integration' },
        // AI Settings only for Admin
        ...(isAdmin ? [{ id: 'ai', label: 'AI Settings' }] : [])
    ];

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${colors.neutral[200]}`,
        backgroundColor: colors.neutral[50],
        fontSize: '14px',
        color: colors.text.primary,
        outline: 'none',
        boxSizing: 'border-box'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: colors.neutral[700],
        marginBottom: '6px'
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: colors.background.paper,
        borderRadius: '12px',
        padding: '24px',
        border: `1px solid ${colors.neutral[200]}`,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        maxWidth: '640px'
    };

    const buttonStyle: React.CSSProperties = {
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
        color: 'white',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer'
    };

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.text.primary, marginBottom: '4px' }}>
                    Settings
                </h1>
                <p style={{ color: colors.text.secondary, margin: 0 }}>
                    Manage your account and preferences
                </p>
            </div>

            {/* Must Change Password Warning */}
            {user?.must_change_password && (
                <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span style={{ color: '#92400E', fontWeight: 500 }}>
                        Please change your default password in the Security tab below.
                    </span>
                </div>
            )}

            {/* Tabs */}
            <div style={{
                borderBottom: `1px solid ${colors.neutral[200]}`,
                marginBottom: '24px',
                display: 'flex',
                gap: '32px'
            }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            paddingBottom: '16px',
                            fontSize: '14px',
                            fontWeight: 500,
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            borderBottom: activeTab === tab.id
                                ? `2px solid ${colors.primary[500]}`
                                : '2px solid transparent',
                            color: activeTab === tab.id
                                ? colors.primary[600]
                                : colors.text.secondary,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary, marginBottom: '24px' }}>
                        Profile Information
                    </h2>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Full name</label>
                            <input
                                type="text"
                                defaultValue={user?.full_name || ''}
                                style={inputStyle}
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Email address</label>
                            <input
                                type="email"
                                defaultValue={user?.email || ''}
                                style={{ ...inputStyle, backgroundColor: colors.neutral[100], cursor: 'not-allowed' }}
                                disabled
                            />
                            <p style={{ marginTop: '4px', fontSize: '12px', color: colors.text.secondary }}>
                                Email cannot be changed
                            </p>
                        </div>
                        <div>
                            <label style={labelStyle}>Organization</label>
                            <input
                                type="text"
                                defaultValue={user?.organization?.name || 'N/A'}
                                style={{ ...inputStyle, backgroundColor: colors.neutral[100], cursor: 'not-allowed' }}
                                disabled
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Role</label>
                            <input
                                type="text"
                                defaultValue={user?.role?.toUpperCase() || 'N/A'}
                                style={{ ...inputStyle, backgroundColor: colors.neutral[100], cursor: 'not-allowed' }}
                                disabled
                            />
                        </div>
                        <div style={{ paddingTop: '8px' }}>
                            <button type="submit" style={buttonStyle}>
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary, marginBottom: '24px' }}>
                        Change Password
                    </h2>

                    {passwordError && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            marginBottom: '16px'
                        }}>
                            <p style={{ color: colors.error.main, margin: 0, fontSize: '14px' }}>{passwordError}</p>
                        </div>
                    )}

                    {passwordSuccess && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            backgroundColor: '#DCFCE7',
                            border: '1px solid #86EFAC',
                            marginBottom: '16px'
                        }}>
                            <p style={{ color: '#166534', margin: 0, fontSize: '14px' }}>{passwordSuccess}</p>
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Current Password</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                style={inputStyle}
                                placeholder="Enter current password"
                                required
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                style={inputStyle}
                                placeholder="Enter new password (min 8 characters)"
                                required
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                style={inputStyle}
                                placeholder="Confirm new password"
                                required
                                minLength={8}
                            />
                        </div>
                        <div style={{ paddingTop: '8px' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    ...buttonStyle,
                                    opacity: saving ? 0.5 : 1,
                                    cursor: saving ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {saving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Jira Integration Tab - Available to All Users */}
            {activeTab === 'jira' && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary, marginBottom: '8px' }}>
                        Jira Integration
                    </h2>
                    <p style={{ fontSize: '14px', color: colors.text.secondary, marginBottom: '24px' }}>
                        Connect your Jira account to import user stories and sync test cases
                    </p>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px',
                        borderRadius: '12px',
                        border: `1px solid ${colors.neutral[200]}`,
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: '#0052CC',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.213 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0z" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, color: colors.text.primary, marginBottom: '4px' }}>Jira Software</p>
                                <p style={{ fontSize: '13px', color: colors.text.secondary, margin: 0 }}>
                                    Import projects and user stories
                                </p>
                            </div>
                        </div>
                        <button style={buttonStyle}>Connect Jira</button>
                    </div>

                    <div style={{
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: colors.primary[50],
                        border: `1px solid ${colors.primary[100]}`
                    }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: colors.primary[700], marginBottom: '8px' }}>
                            How it works
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: colors.text.secondary, lineHeight: 1.8 }}>
                            <li>Connect your Jira account using OAuth</li>
                            <li>Select projects to sync user stories from</li>
                            <li>Generate AI test cases from imported stories</li>
                            <li>Push test cases back to Jira as test items</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* AI Settings Tab - Admin Only */}
            {activeTab === 'ai' && isAdmin && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary, marginBottom: '8px' }}>
                        AI Configuration
                    </h2>
                    <p style={{ fontSize: '14px', color: colors.text.secondary, marginBottom: '24px' }}>
                        Configure AI settings for your organization. These settings apply to all team members.
                    </p>

                    <form onSubmit={handleSaveAI} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Row 1: Provider and Model */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Provider</label>
                                <select
                                    style={inputStyle}
                                    value={aiProvider}
                                    onChange={(e) => setAiProvider(e.target.value)}
                                >
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="google">Google AI</option>
                                    <option value="litellm">LiteLLM Proxy</option>
                                </select>
                                <p style={{ marginTop: '4px', fontSize: '12px', color: colors.text.secondary }}>
                                    {aiProvider === 'litellm' ? 'Multi-model access via LiteLLM proxy server' : `Direct API access to ${aiProvider}`}
                                </p>
                            </div>
                            <div>
                                <label style={labelStyle}>Model</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    placeholder="e.g., gpt-4o, gemini-pro"
                                    value={aiModel === 'custom' ? customModel : aiModel}
                                    onChange={(e) => {
                                        setAiModel('custom');
                                        setCustomModel(e.target.value);
                                    }}
                                    list="model-suggestions"
                                />
                                <datalist id="model-suggestions">
                                    {PROVIDER_MODELS[aiProvider]?.map(m => (
                                        <option key={m} value={m} />
                                    ))}
                                </datalist>
                                <p style={{ marginTop: '4px', fontSize: '12px', color: colors.text.secondary }}>
                                    Select from suggestions or type a custom model name
                                </p>
                            </div>
                        </div>

                        {/* Row 2: LiteLLM Proxy URL (conditional) */}
                        {aiProvider === 'litellm' && (
                            <div>
                                <label style={labelStyle}>LiteLLM Proxy URL</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    placeholder="https://litellm.example.com"
                                    value={aiBaseUrl}
                                    onChange={(e) => setAiBaseUrl(e.target.value)}
                                />
                                <p style={{ marginTop: '4px', fontSize: '12px', color: colors.text.secondary }}>
                                    Your LiteLLM proxy server endpoint
                                </p>
                            </div>
                        )}

                        {/* Row 3: API Key */}
                        <div>
                            <label style={labelStyle}>API Key</label>
                            <input
                                type="password"
                                style={inputStyle}
                                placeholder="Enter your API key..."
                                value={aiApiKey}
                                onChange={(e) => setAiApiKey(e.target.value)}
                            />
                        </div>

                        {/* Connection Status */}
                        {aiMessage && (
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                backgroundColor: aiMessage.type === 'success' ? '#E3FCEF' : '#FEE2E2',
                                border: `1px solid ${aiMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                {aiMessage.type === 'success' ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                                <span style={{
                                    color: aiMessage.type === 'success' ? '#065F46' : '#991B1B',
                                    fontSize: '14px'
                                }}>
                                    {aiMessage.text}
                                </span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="submit"
                                disabled={aiSaving || !aiApiKey}
                                style={{
                                    ...buttonStyle,
                                    opacity: aiSaving || !aiApiKey ? 0.5 : 1,
                                    cursor: aiApiKey ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {aiSaving ? 'Saving...' : 'Save Configuration'}
                            </button>
                            <button
                                type="button"
                                onClick={handleTestAI}
                                disabled={aiTesting || !aiApiKey}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: `1px solid ${colors.neutral[300]}`,
                                    background: 'white',
                                    color: colors.text.primary,
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: aiApiKey ? 'pointer' : 'not-allowed',
                                    opacity: aiTesting ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {aiTesting ? 'Testing...' : 'Test Connection'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

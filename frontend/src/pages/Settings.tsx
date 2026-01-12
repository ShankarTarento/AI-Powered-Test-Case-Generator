import { useState } from 'react';
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

                    <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>AI Provider</label>
                            <select style={inputStyle}>
                                <option value="openai">OpenAI (GPT-4)</option>
                                <option value="anthropic">Anthropic (Claude)</option>
                                <option value="google">Google AI (Gemini)</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>API Key</label>
                            <input
                                type="password"
                                style={inputStyle}
                                placeholder="sk-..."
                            />
                            <p style={{ marginTop: '4px', fontSize: '12px', color: colors.text.secondary }}>
                                Your API key is encrypted and stored securely
                            </p>
                        </div>
                        <div>
                            <label style={labelStyle}>Model</label>
                            <select style={inputStyle}>
                                <option value="gpt-4o">GPT-4o (Recommended)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Max Tokens</label>
                            <input
                                type="number"
                                style={inputStyle}
                                defaultValue={4096}
                                min={256}
                                max={8192}
                            />
                        </div>
                        <div style={{ paddingTop: '8px' }}>
                            <button type="submit" style={buttonStyle}>
                                Save AI Settings
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

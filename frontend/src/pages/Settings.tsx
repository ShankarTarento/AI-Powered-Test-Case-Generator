import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

export default function Settings() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profile' },
        { id: 'integrations', label: 'Integrations' },
        { id: 'ai', label: 'AI Settings' },
        { id: 'notifications', label: 'Notifications' },
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

            {/* Tab Content */}
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
                        <div style={{ paddingTop: '8px' }}>
                            <button type="submit" style={buttonStyle}>
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'integrations' && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary, marginBottom: '24px' }}>
                        Integrations
                    </h2>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        borderRadius: '12px',
                        border: `1px solid ${colors.neutral[200]}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: colors.primary[100],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill={colors.primary[600]}>
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontWeight: 500, color: colors.text.primary, marginBottom: '2px' }}>Jira</p>
                                <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>
                                    Connect to sync user stories
                                </p>
                            </div>
                        </div>
                        <button style={buttonStyle}>Connect</button>
                    </div>
                </div>
            )}

            {activeTab === 'ai' && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary, marginBottom: '24px' }}>
                        AI Settings
                    </h2>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>AI Provider</label>
                            <select style={inputStyle}>
                                <option>OpenAI</option>
                                <option>Anthropic</option>
                                <option>Google AI</option>
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
                        <div style={{ paddingTop: '8px' }}>
                            <button type="submit" style={buttonStyle}>
                                Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary, marginBottom: '24px' }}>
                        Notification Preferences
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { label: 'Email notifications for new test cases', defaultChecked: true },
                            { label: 'Weekly summary reports', defaultChecked: true },
                            { label: 'Sprint completion alerts', defaultChecked: false }
                        ].map((item, index) => (
                            <label
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    defaultChecked={item.defaultChecked}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        accentColor: colors.primary[500]
                                    }}
                                />
                                <span style={{ fontSize: '14px', color: colors.neutral[700] }}>
                                    {item.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

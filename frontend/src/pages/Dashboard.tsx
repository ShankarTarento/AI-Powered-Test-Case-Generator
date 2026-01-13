import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { colors } from '../theme';

interface StatCardProps {
    title: string;
    value: string;
    icon: string;
    iconBg: string;
    iconColor: string;
}

function StatCard({ title, value, icon, iconBg, iconColor }: StatCardProps) {
    return (
        <div style={{
            backgroundColor: colors.background.paper,
            borderRadius: '12px',
            padding: '24px',
            border: `1px solid ${colors.neutral[200]}`,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={icon} />
                    </svg>
                </div>
                <div>
                    <p style={{ fontSize: '14px', color: colors.text.secondary, marginBottom: '4px' }}>{title}</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: colors.text.primary, margin: 0 }}>{value}</p>
                </div>
            </div>
        </div>
    );
}

interface StepCardProps {
    step: number;
    title: string;
    description: string;
    isActive: boolean;
    isCompleted?: boolean;
    buttonLabel?: string;
    onButtonClick?: () => void;
}

function StepCard({ step, title, description, isActive, isCompleted, buttonLabel, onButtonClick }: StepCardProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: isCompleted ? '#DCFCE7' : colors.neutral[50],
            border: `1px solid ${isCompleted ? colors.success.main : colors.neutral[200]}`,
            opacity: isActive ? 1 : 0.5
        }}>
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isCompleted ? colors.success.main : (isActive ? colors.primary[100] : colors.neutral[200]),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCompleted ? 'white' : (isActive ? colors.primary[600] : colors.neutral[500]),
                fontWeight: 600,
                fontSize: '14px'
            }}>
                {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" />
                    </svg>
                ) : step}
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, color: colors.text.primary, marginBottom: '2px' }}>{title}</p>
                <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>{description}</p>
            </div>
            {buttonLabel && isActive && !isCompleted && (
                <button
                    onClick={onButtonClick}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}
                >
                    {buttonLabel}
                </button>
            )}
            {isCompleted && (
                <span style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    backgroundColor: colors.success.main,
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 500
                }}>
                    Connected
                </span>
            )}
        </div>
    );
}

export default function Dashboard() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [isJiraConnected, setIsJiraConnected] = useState(false);
    const [jiraSiteName, setJiraSiteName] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState(true); // Assume true until we check

    useEffect(() => {
        const checkJiraStatus = async () => {
            try {
                const status = await apiClient.getJiraStatus();
                setIsJiraConnected(status.is_connected);
                setJiraSiteName(status.site_name);
            } catch (err) {
                console.error('Failed to check Jira status:', err);
            }
        };

        const checkApiKeyStatus = async () => {
            try {
                const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_BASE}/api/v1/ai/providers`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                const data = await response.json();
                const config = data.user_configuration || {};
                const anyConfigured = Object.values(config).some(v => v === true);
                setHasApiKey(anyConfigured);
            } catch (err) {
                console.error('Failed to check API key status:', err);
            }
        };

        checkJiraStatus();
        checkApiKeyStatus();
    }, []);

    const handleConnectJira = async () => {
        try {
            const { url } = await apiClient.getJiraConnectUrl();
            window.location.href = url;
        } catch (err) {
            alert('Failed to initiate Jira connection');
        }
    };

    // Check if setup is complete (for admins: has projects or Jira connected)
    const isSetupComplete = isJiraConnected;

    const stats = [
        {
            title: 'Test Cases',
            value: '0',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            iconBg: colors.primary[100],
            iconColor: colors.primary[600]
        },
        {
            title: 'Coverage',
            value: '0%',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            iconBg: '#DCFCE7',
            iconColor: colors.success.main
        },
        {
            title: 'AI Generated',
            value: '0',
            icon: 'M13 10V3L4 14h7v7l9-11h-7z',
            iconBg: colors.secondary[100],
            iconColor: colors.secondary[600]
        },
        {
            title: 'Time Saved',
            value: '0h',
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            iconBg: '#FEF3C7',
            iconColor: colors.warning.main
        }
    ];

    // Different getting started steps based on role
    const adminSteps = [
        {
            title: 'Configure AI settings',
            description: 'Set up your preferred AI provider and API key for the organization',
            buttonLabel: 'Configure AI',
            onButtonClick: () => navigate('/settings'),
            isCompleted: false
        },
        {
            title: 'Create a project',
            description: 'Create projects and invite your QA team members',
            buttonLabel: 'Create Project',
            onButtonClick: () => navigate('/projects'),
            isCompleted: false
        },
        {
            title: isJiraConnected ? 'Jira Connected' : 'Connect Jira (Optional)',
            description: isJiraConnected ? 'Your Jira account is connected. You can now sync user stories.' : 'Import user stories from Jira to generate test cases',
            buttonLabel: 'Connect Jira',
            onButtonClick: handleConnectJira,
            isCompleted: isJiraConnected
        }
    ];

    const qaSteps = [
        {
            title: isJiraConnected ? 'Jira Connected' : 'Connect your Jira account',
            description: isJiraConnected ? 'Your Jira account is connected.' : 'Link your Jira account to import user stories',
            buttonLabel: 'Connect Jira',
            onButtonClick: handleConnectJira,
            isCompleted: isJiraConnected
        },
        {
            title: 'View your projects',
            description: 'Access the projects you have been assigned to',
            buttonLabel: 'View Projects',
            onButtonClick: () => navigate('/projects'),
            isCompleted: false
        },
        {
            title: 'Generate test cases',
            description: 'Open a project and use the Generate tab to create AI-powered test cases',
            buttonLabel: 'Go to Projects',
            onButtonClick: () => navigate('/projects'),
            isCompleted: false
        }
    ];

    const steps = isAdmin ? adminSteps : qaSteps;

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.text.primary, marginBottom: '4px' }}>
                    Dashboard
                </h1>
                <p style={{ color: colors.text.secondary, margin: 0 }}>
                    Welcome back, {user?.full_name || user?.email || 'User'}!
                    {isAdmin && (
                        <span style={{
                            marginLeft: '12px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: colors.secondary[100],
                            color: colors.secondary[700],
                            fontSize: '12px',
                            fontWeight: 500
                        }}>
                            Admin
                        </span>
                    )}
                </p>
            </div>

            {/* Must Change Password Warning for QA */}
            {user?.must_change_password && (
                <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span style={{ color: '#92400E', fontWeight: 500 }}>
                            Please change your default password for security.
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/settings')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #D97706',
                            backgroundColor: 'transparent',
                            color: '#92400E',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        Change Password
                    </button>
                </div>
            )}

            {/* API Key Warning */}
            {!hasApiKey && (
                <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span style={{ color: '#991B1B', fontWeight: 500 }}>
                            No AI API key configured. AI test case generation will not work.
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/ai-settings')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #DC2626',
                            backgroundColor: 'transparent',
                            color: '#991B1B',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        Configure API Key
                    </button>
                </div>
            )}

            {/* Quick Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Quick Actions (when setup complete) or Getting Started (when not) */}
            {isSetupComplete ? (
                <div style={{
                    backgroundColor: colors.background.paper,
                    borderRadius: '12px',
                    padding: '24px',
                    border: `1px solid ${colors.neutral[200]}`,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary, marginBottom: '20px' }}>
                        Quick Actions
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {/* Create New Project - Admin Only */}
                        {isAdmin && (
                            <div
                                onClick={() => navigate('/projects')}
                                style={{
                                    padding: '20px',
                                    borderRadius: '12px',
                                    backgroundColor: colors.primary[50],
                                    border: `2px dashed ${colors.primary[300]}`,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, color: colors.text.primary, marginBottom: '4px' }}>Create New Project</p>
                                    <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>Start a new testing project</p>
                                </div>
                            </div>
                        )}

                        {/* Connected Jira Account */}
                        {isJiraConnected && (
                            <div style={{
                                padding: '20px',
                                borderRadius: '12px',
                                backgroundColor: '#DCFCE7',
                                border: `1px solid ${colors.success.main}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: colors.success.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: colors.text.primary, marginBottom: '4px' }}>Jira Connected</p>
                                    <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>
                                        {jiraSiteName || 'Your Jira account'}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '16px',
                                    backgroundColor: colors.success.main,
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 500
                                }}>
                                    Active
                                </span>
                            </div>
                        )}

                        {/* View Projects */}
                        <div
                            onClick={() => navigate('/projects')}
                            style={{
                                padding: '20px',
                                borderRadius: '12px',
                                backgroundColor: colors.neutral[50],
                                border: `1px solid ${colors.neutral[200]}`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: colors.secondary[100],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.secondary[600]} strokeWidth="2">
                                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, color: colors.text.primary, marginBottom: '4px' }}>View Projects</p>
                                <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>Manage your test projects</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    backgroundColor: colors.background.paper,
                    borderRadius: '12px',
                    padding: '24px',
                    border: `1px solid ${colors.neutral[200]}`,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary, marginBottom: '20px' }}>
                        Getting Started {!isAdmin && '- QA Workflow'}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {steps.map((step, index) => (
                            <StepCard
                                key={index}
                                step={index + 1}
                                title={step.title}
                                description={step.description}
                                isActive={true}
                                isCompleted={step.isCompleted}
                                buttonLabel={step.buttonLabel}
                                onButtonClick={step.onButtonClick}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

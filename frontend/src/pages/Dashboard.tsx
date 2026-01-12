import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    buttonLabel?: string;
    onButtonClick?: () => void;
}

function StepCard({ step, title, description, isActive, buttonLabel, onButtonClick }: StepCardProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: colors.neutral[50],
            border: `1px solid ${colors.neutral[200]}`,
            opacity: isActive ? 1 : 0.5
        }}>
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isActive ? colors.primary[100] : colors.neutral[200],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? colors.primary[600] : colors.neutral[500],
                fontWeight: 600,
                fontSize: '14px'
            }}>
                {step}
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, color: colors.text.primary, marginBottom: '2px' }}>{title}</p>
                <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>{description}</p>
            </div>
            {buttonLabel && isActive && (
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
        </div>
    );
}

export default function Dashboard() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();

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
            onButtonClick: () => navigate('/settings')
        },
        {
            title: 'Create a project',
            description: 'Create projects and invite your QA team members',
            buttonLabel: 'Create Project',
            onButtonClick: () => navigate('/projects')
        },
        {
            title: 'Connect Jira (Optional)',
            description: 'Import user stories from Jira to generate test cases',
            buttonLabel: 'Connect Jira',
            onButtonClick: () => navigate('/settings')
        }
    ];

    const qaSteps = [
        {
            title: 'Connect your Jira account',
            description: 'Link your Jira account to import user stories',
            buttonLabel: 'Connect Jira',
            onButtonClick: () => navigate('/settings')
        },
        {
            title: 'View your projects',
            description: 'Access the projects you have been assigned to',
            buttonLabel: 'View Projects',
            onButtonClick: () => navigate('/projects')
        },
        {
            title: 'Generate test cases',
            description: 'Open a project and use the Generate tab to create AI-powered test cases',
            buttonLabel: 'Go to Projects',
            onButtonClick: () => navigate('/projects')
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

            {/* Getting Started */}
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
                            buttonLabel={step.buttonLabel}
                            onButtonClick={step.onButtonClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

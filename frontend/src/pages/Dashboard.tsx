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
    const { user } = useAuth();

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
            iconBg: '#DCFCE7',  // Light green
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
            iconBg: '#FEF3C7',  // Light amber
            iconColor: colors.warning.main
        }
    ];

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.text.primary, marginBottom: '4px' }}>
                    Dashboard
                </h1>
                <p style={{ color: colors.text.secondary, margin: 0 }}>
                    Welcome back, {user?.full_name || user?.email || 'User'}!
                </p>
            </div>

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
                    Getting Started
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <StepCard
                        step={1}
                        title="Connect your Jira account"
                        description="Import your projects and user stories"
                        isActive={true}
                        buttonLabel="Connect Jira"
                    />
                    <StepCard
                        step={2}
                        title="Configure AI settings"
                        description="Set up your preferred AI provider and model"
                        isActive={false}
                    />
                    <StepCard
                        step={3}
                        title="Generate test cases"
                        description="Select user stories and generate AI-powered test cases"
                        isActive={false}
                    />
                </div>
            </div>
        </div>
    );
}

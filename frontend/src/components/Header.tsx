import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

export default function Header() {
    const { logout, user } = useAuth();

    return (
        <header style={{
            backgroundColor: colors.background.paper,
            borderBottom: `1px solid ${colors.neutral[200]}`,
            padding: '16px 24px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[700]} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <h1 style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: colors.text.primary,
                        margin: 0
                    }}>
                        TestGen AI
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '14px', color: colors.text.secondary }}>
                        {user?.full_name || user?.email || 'User'}
                    </span>
                    <button
                        onClick={logout}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.neutral[200]}`,
                            backgroundColor: colors.background.paper,
                            color: colors.text.secondary,
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}

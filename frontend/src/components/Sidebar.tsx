import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

interface NavItem {
    path: string;
    label: string;
    icon: string;
    adminOnly?: boolean;
}

export default function Sidebar() {
    const location = useLocation();
    const { isAdmin } = useAuth();

    const links: NavItem[] = [
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
        },
        {
            path: '/projects',
            label: 'Projects',
            icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
        },
        {
            path: '/knowledge-base',
            label: 'Knowledge Base',
            icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
        },
        {
            path: '/analytics',
            label: 'Analytics',
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        },
        {
            path: '/users',
            label: 'Users',
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
            adminOnly: true
        },
        {
            path: '/ai-settings',
            label: 'AI Settings',
            icon: 'M13 10V3L4 14h7v7l9-11h-7z'
        },
        {
            path: '/settings',
            label: 'Settings',
            icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
        },
    ];

    // Filter out admin-only links for non-admin users
    const visibleLinks = links.filter(link => !link.adminOnly || isAdmin);

    return (
        <aside style={{
            width: '256px',
            backgroundColor: colors.background.paper,
            borderRight: `1px solid ${colors.neutral[200]}`,
            minHeight: 'calc(100vh - 73px)'
        }}>
            <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visibleLinks.map((link) => {
                    const isActive = location.pathname === link.path ||
                        (link.path === '/dashboard' && location.pathname === '/') ||
                        (link.path === '/projects' && location.pathname.startsWith('/projects'));

                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                backgroundColor: isActive ? colors.primary[50] : 'transparent',
                                color: isActive ? colors.primary[600] : colors.text.secondary,
                                fontWeight: isActive ? 500 : 400,
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d={link.icon} />
                            </svg>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Admin Badge */}
            {isAdmin && (
                <div style={{
                    margin: '16px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: colors.secondary[50],
                    border: `1px solid ${colors.secondary[200]}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.secondary[600]} strokeWidth="2">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: colors.secondary[700] }}>
                            Admin Access
                        </span>
                    </div>
                </div>
            )}

            {/* Help Text */}
            <div style={{
                margin: '16px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: colors.neutral[50],
                border: `1px solid ${colors.neutral[200]}`
            }}>
                <p style={{ fontSize: '12px', color: colors.text.secondary, margin: 0, lineHeight: 1.5 }}>
                    <strong>Tip:</strong> Test cases are managed within each project. Go to Projects → Select a project to view or generate test cases.
                </p>
            </div>
        </aside>
    );
}

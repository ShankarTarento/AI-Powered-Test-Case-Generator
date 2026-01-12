import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        organizationName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!formData.organizationName.trim()) {
            setError('Organization name is required');
            return;
        }

        setLoading(true);
        try {
            await register({
                email: formData.email,
                password: formData.password,
                confirm_password: formData.confirmPassword,
                full_name: formData.fullName || undefined,
                organization_name: formData.organizationName
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '10px',
        border: `1px solid ${colors.neutral[200]}`,
        backgroundColor: colors.neutral[50],
        fontSize: '15px',
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

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            backgroundColor: colors.background.default
        }}>
            {/* Left Panel - Branding */}
            <div style={{
                width: '50%',
                background: `linear-gradient(135deg, ${colors.primary[700]} 0%, ${colors.primary[900]} 100%)`,
                padding: '48px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Logo */}
                <div style={{ marginBottom: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>TestGen AI</span>
                    </div>
                </div>

                {/* Hero Text */}
                <h1 style={{
                    fontSize: '42px',
                    fontWeight: 700,
                    color: 'white',
                    lineHeight: 1.2,
                    marginBottom: '24px'
                }}>
                    Start Your<br />
                    <span style={{ color: colors.secondary[400] }}>Testing Journey</span>
                </h1>
                <p style={{
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.8)',
                    maxWidth: '400px',
                    lineHeight: 1.6
                }}>
                    Create your organization and invite your QA team to collaborate on test case generation.
                </p>

                {/* Feature cards */}
                <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                        { title: 'Multi-Tenant', desc: 'Isolated organization workspaces' },
                        { title: 'Team Collaboration', desc: 'Add QA members to projects' },
                        { title: 'AI-Powered', desc: 'Generate tests from user stories' }
                    ].map((feature, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px 20px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            maxWidth: '360px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                backgroundColor: colors.secondary[500],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, color: 'white', marginBottom: '2px' }}>{feature.title}</p>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel - Form */}
            <div style={{
                width: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px'
            }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: colors.text.primary,
                        marginBottom: '8px'
                    }}>
                        Create your account
                    </h2>
                    <p style={{
                        color: colors.text.secondary,
                        marginBottom: '32px'
                    }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: colors.primary[500], textDecoration: 'none', fontWeight: 500 }}>
                            Sign in
                        </Link>
                    </p>

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            marginBottom: '24px'
                        }}>
                            <p style={{ color: colors.error.main, margin: 0, fontSize: '14px' }}>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Organization Name *</label>
                            <input
                                type="text"
                                value={formData.organizationName}
                                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                style={inputStyle}
                                placeholder="Your company or team name"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                style={inputStyle}
                                placeholder="John Doe"
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Email Address *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={inputStyle}
                                placeholder="you@company.com"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Password *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                style={inputStyle}
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Confirm Password *</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                style={inputStyle}
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p style={{
                        fontSize: '12px',
                        color: colors.text.secondary,
                        textAlign: 'center',
                        marginTop: '24px'
                    }}>
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}

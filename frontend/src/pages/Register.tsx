import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) {
            setError('Please enter your full name');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Please enter your email address');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match. Please try again.');
            return false;
        }
        if (!agreeTerms) {
            setError('Please accept the terms and conditions to continue');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                confirm_password: formData.confirmPassword,
                full_name: formData.fullName,
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        {
            title: 'AI-Powered Analysis',
            description: 'Generate test cases automatically from Jira user stories',
            icon: 'M13 10V3L4 14h7v7l9-11h-7z'
        },
        {
            title: 'Smart Responses',
            description: 'Get comprehensive test coverage with AI assistance',
            icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
        },
        {
            title: '10x Faster',
            description: 'Reduce test case creation time dramatically',
            icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
        },
        {
            title: 'Coverage Analysis',
            description: 'Ensure all requirements are properly tested',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        }
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

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'row',
            width: '100%'
        }}>
            {/* Left Panel - Branding & Features */}
            <div style={{
                display: 'none',
                width: '50%',
                position: 'relative',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${colors.neutral[900]} 0%, ${colors.primary[900]} 50%, ${colors.primary[800]} 100%)`,
                padding: '40px',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }} className="lg:flex">
                {/* Decorative orbs */}
                <div style={{
                    position: 'absolute',
                    top: '25%',
                    left: '25%',
                    width: '384px',
                    height: '384px',
                    borderRadius: '50%',
                    backgroundColor: colors.primary[500],
                    opacity: 0.2,
                    filter: 'blur(64px)'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '25%',
                    right: '25%',
                    width: '320px',
                    height: '320px',
                    borderRadius: '50%',
                    backgroundColor: colors.secondary[500],
                    opacity: 0.15,
                    filter: 'blur(64px)'
                }} />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10 }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[700]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 10px 25px -5px ${colors.primary[500]}50`
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>TestGen AI</span>
                    </div>
                </div>

                {/* Hero Text & Features */}
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '480px' }}>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: 700,
                        color: 'white',
                        lineHeight: 1.2,
                        marginBottom: '16px'
                    }}>
                        Start Generating Test Cases Today
                    </h1>
                    <p style={{ color: colors.neutral[300], fontSize: '16px', marginBottom: '40px' }}>
                        Join thousands of QA teams who save 60-70% of their time
                    </p>

                    {/* Features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    minWidth: '40px',
                                    borderRadius: '8px',
                                    background: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[700]} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d={feature.icon} />
                                    </svg>
                                </div>
                                <div>
                                    <h3 style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                                        {feature.title}
                                    </h3>
                                    <p style={{ color: colors.neutral[400], fontSize: '12px', margin: 0 }}>
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ position: 'relative', zIndex: 10, color: colors.neutral[500], fontSize: '14px' }}>
                    © 2026 TestGen AI. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Register Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
                backgroundColor: colors.background.default,
                minHeight: '100vh',
                overflowY: 'auto'
            }}>
                <div style={{ width: '100%', maxWidth: '400px', padding: '32px 0' }}>
                    {/* Mobile Logo */}
                    <div className="lg:hidden" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        marginBottom: '32px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[700]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '20px', color: colors.text.primary }}>TestGen AI</span>
                    </div>

                    {/* Welcome Text */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.text.primary, marginBottom: '8px' }}>
                            Create your account
                        </h2>
                        <p style={{ color: colors.text.secondary, fontSize: '14px' }}>
                            Start your free trial today - no credit card required
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            marginBottom: '24px',
                            padding: '16px',
                            borderRadius: '8px',
                            backgroundColor: '#FEF2F2',
                            border: `1px solid ${colors.error.light}`
                        }}>
                            <p style={{
                                fontSize: '14px',
                                color: colors.error.main,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                margin: 0
                            }}>
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Register Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Full Name Field */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Full name</label>
                            <input
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Email Field */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Email address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@company.com"
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Password Field */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    style={{ ...inputStyle, paddingRight: '48px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: colors.neutral[400],
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {showPassword ? (
                                            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        ) : (
                                            <>
                                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                            <p style={{ marginTop: '6px', fontSize: '12px', color: colors.neutral[500] }}>
                                Must be at least 8 characters
                            </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Confirm password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    style={{ ...inputStyle, paddingRight: '48px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: colors.neutral[400],
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {showConfirmPassword ? (
                                            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        ) : (
                                            <>
                                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    marginTop: '2px',
                                    accentColor: colors.primary[500]
                                }}
                            />
                            <label style={{ fontSize: '14px', color: colors.neutral[600], lineHeight: 1.4 }}>
                                I agree to the{' '}
                                <a href="#" style={{ color: colors.primary[500], textDecoration: 'none' }}>Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" style={{ color: colors.primary[500], textDecoration: 'none' }}>Privacy Policy</a>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.5 : 1,
                                boxShadow: `0 4px 15px -3px ${colors.primary[500]}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                            opacity="0.25"
                                        />
                                        <path
                                            fill="currentColor"
                                            opacity="0.75"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Creating account...
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <p style={{
                        marginTop: '32px',
                        textAlign: 'center',
                        color: colors.neutral[600],
                        fontSize: '14px'
                    }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: colors.primary[500], fontWeight: 600, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* CSS for spinner animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

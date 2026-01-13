import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { colors } from './theme';
import {
    Dashboard,
    Login,
    Register,
    Settings,
    Projects,
    ProjectDetail,
    StoryDetail,
    AISettings,
    KnowledgeBase
} from './pages';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.background.default
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[700]} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        animation: 'pulse 2s infinite'
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <p style={{ color: colors.text.secondary, fontSize: '14px' }}>Loading...</p>
                </div>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `}</style>
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/stories/:id" element={<StoryDetail />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/ai-settings" element={<AISettings />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={
                    <div style={{
                        padding: '48px',
                        textAlign: 'center',
                        color: colors.text.secondary
                    }}>
                        <h1 style={{ fontSize: '48px', color: colors.text.primary, marginBottom: '8px' }}>404</h1>
                        <p>Page Not Found</p>
                    </div>
                } />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;

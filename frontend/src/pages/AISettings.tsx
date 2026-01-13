import { useState, useEffect } from 'react';
import { colors } from '../theme';

interface ProviderConfig {
    name: string;
    alias: string;
    icon: string;
}

const PROVIDERS: ProviderConfig[] = [
    { name: 'openai', alias: 'OpenAI (GPT-4o, GPT-4 Turbo)', icon: '⚡' },
    { name: 'anthropic', alias: 'Anthropic (Claude 3.5 Sonnet)', icon: '🕵️' },
    { name: 'google', alias: 'Google (Gemini 2.0, Pro)', icon: '💎' },
    { name: 'azure', alias: 'Azure OpenAI', icon: '☁️' },
];

export default function AISettings() {
    const [configs, setConfigs] = useState<Record<string, boolean>>({});
    const [activeProvider, setActiveProvider] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch current config status
    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/api/v1/ai/providers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            const data = await response.json();
            setConfigs(data.user_configuration || {});
        } catch (error) {
            console.error('Failed to fetch config', error);
        }
    };

    const handleSave = async () => {
        if (!activeProvider || !apiKey) return;
        setLoading(true);
        setMessage(null);

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/api/v1/ai/configure`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ provider: activeProvider, api_key: apiKey })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: `Successfully configured ${activeProvider}!` });
                setApiKey('');
                setActiveProvider(null);
                fetchConfig();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to save configuration' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!activeProvider || !apiKey) return;
        setTesting(true);
        setMessage(null);

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/api/v1/ai/test-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ provider: activeProvider, api_key: apiKey })
            });

            if (response.ok) {
                const data = await response.json();
                setMessage({ type: 'success', text: data.message || `Connection successful!` });
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Connection test failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error during test' });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '800px' }}>
            <h1 style={{ color: colors.text.primary, marginBottom: '8px' }}>AI Provider Settings</h1>
            <p style={{ color: colors.text.secondary, marginBottom: '32px' }}>
                Bring Your Own Key (BYOK): Configure your own API keys to use for test case generation.
                Your keys are encrypted and stored securely.
            </p>

            <div style={{ display: 'grid', gap: '24px' }}>
                {PROVIDERS.map(p => (
                    <div key={p.name} style={{
                        padding: '24px',
                        borderRadius: '12px',
                        border: `1px solid ${colors.neutral[200]}`,
                        backgroundColor: colors.background.paper,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px' }}>{p.icon}</span>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>{p.alias}</h3>
                                    <span style={{
                                        fontSize: '12px',
                                        color: configs[p.name] ? colors.secondary[600] : colors.neutral[500],
                                        fontWeight: 500
                                    }}>
                                        {configs[p.name] ? '● Key Configured' : '○ Not Configured'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveProvider(activeProvider === p.name ? null : p.name);
                                    setMessage(null);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: `1px solid ${colors.neutral[300]}`,
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {activeProvider === p.name ? 'Cancel' : 'Configure'}
                            </button>
                        </div>

                        {activeProvider === p.name && (
                            <div style={{
                                marginTop: '16px',
                                padding: '16px',
                                backgroundColor: colors.neutral[50],
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <label style={{ fontSize: '14px', fontWeight: 500 }}>API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={`Enter your ${p.name} API key`}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: `1px solid ${colors.neutral[300]}`,
                                        fontSize: '14px'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={handleTestConnection}
                                        disabled={testing || !apiKey}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '6px',
                                            backgroundColor: 'white',
                                            color: colors.primary[600],
                                            border: `1px solid ${colors.primary[300]}`,
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            opacity: testing ? 0.7 : 1
                                        }}
                                    >
                                        {testing ? 'Testing...' : '🔗 Test Connection'}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || !apiKey}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '6px',
                                            backgroundColor: colors.primary[600],
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Save Configuration'}
                                    </button>
                                </div>
                                {message && (
                                    <div style={{
                                        fontSize: '13px',
                                        color: message.type === 'success' ? colors.success.dark : colors.error.dark,
                                        marginTop: '4px'
                                    }}>
                                        {message.text}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

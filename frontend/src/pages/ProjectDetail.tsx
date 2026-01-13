import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
    apiClient,
    ProjectDetail as ProjectDetailType,
    Feature
} from '../services/api';
import { colors } from '../theme';

type TabType = 'overview' | 'features' | 'test-cases';

export default function ProjectDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Data states
    const [project, setProject] = useState<ProjectDetailType | null>(null);
    const [features, setFeatures] = useState<Feature[]>([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('features');
    const [isJiraConnected, setIsJiraConnected] = useState(false);
    const [jiraSiteName, setJiraSiteName] = useState<string | null>(null);
    const [importKey, setImportKey] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadProjectData();
        }
    }, [id, activeTab]);

    const loadProjectData = async () => {
        try {
            const projectData = await apiClient.getProject(id!);
            setProject(projectData);

            if (activeTab === 'features') {
                const featuresData = await apiClient.getProjectFeatures(id!);
                setFeatures(featuresData);

                try {
                    const status = await apiClient.getJiraStatus();
                    setIsJiraConnected(status.is_connected);
                    setJiraSiteName(status.site_name);
                } catch (e) {
                    console.error('Failed to check Jira status', e);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    const handleImportByKey = async () => {
        if (!importKey.trim()) {
            alert('Please enter a Jira key (e.g., KB-11643)');
            return;
        }
        setActionLoading(true);
        try {
            const result = await apiClient.importByJiraKey(id!, importKey.trim());
            setImportKey('');
            loadProjectData();
            alert(result.message);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to import issue');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConnectJira = async () => {
        try {
            const { url } = await apiClient.getJiraConnectUrl();
            window.location.href = url;
        } catch (err) {
            alert('Failed to initiate Jira connection');
        }
    };

    const handleGenerateAI = async (featureId: string) => {
        setActionLoading(true);
        try {
            await apiClient.generateTestCases(featureId);
            loadProjectData();
            alert('Test cases generated successfully!');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to generate test cases');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkGenerateAI = async (epicId: string) => {
        if (!confirm('This will generate test cases for all child stories. Continue?')) return;
        setActionLoading(true);
        try {
            const result = await apiClient.bulkGenerateTestCases(epicId);
            loadProjectData();
            alert(`Bulk generation complete! Processed ${result.stories_processed} stories and generated ${result.test_cases_generated} test cases.`);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed bulk generation');
        } finally {
            setActionLoading(false);
        }
    };

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'features' as TabType, label: 'Epics & Stories', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'test-cases' as TabType, label: 'Test Cases', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' }
    ];

    if (loading && !project) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!project) return <div style={{ padding: '40px', textAlign: 'center' }}>Project not found</div>;

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '24px'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.text.primary, marginBottom: '4px' }}>
                        {project.name}
                    </h1>
                    <p style={{ color: colors.text.secondary }}>{project.description || 'No description'}</p>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div style={{ borderBottom: `1px solid ${colors.neutral[200]}`, marginBottom: '24px', display: 'flex', gap: '8px' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontWeight: 500,
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            borderBottom: activeTab === tab.id ? `2px solid ${colors.primary[500]}` : '2px solid transparent',
                            color: activeTab === tab.id ? colors.primary[600] : colors.text.secondary
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={tab.icon} /></svg>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div style={{ background: colors.background.paper, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.neutral[200]}` }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Overview</h2>
                    <p style={{ color: colors.text.secondary }}>
                        Use the tabs above to import epics/stories from Jira and manage test cases.
                    </p>
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Team Members ({project.members.length})</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {project.members.map(m => (
                                <div key={m.id} style={{ padding: '12px', background: colors.neutral[50], borderRadius: '8px', border: `1px solid ${colors.neutral[200]}` }}>
                                    <div style={{ fontWeight: 500 }}>{m.full_name || m.email}</div>
                                    <div style={{ fontSize: '12px', color: colors.text.secondary }}>{m.role}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Epics & User Stories Tab */}
            {activeTab === 'features' && (
                <div>
                    {/* Jira Connection Status Banner */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                        padding: '12px 16px',
                        background: isJiraConnected ? '#E3FCEF' : '#FFFAE6',
                        borderRadius: '8px',
                        border: `1px solid ${isJiraConnected ? '#36B37E' : '#FFE380'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: isJiraConnected ? '#36B37E' : '#FF991F'
                            }} />
                            <div>
                                <span style={{ fontWeight: 500, color: isJiraConnected ? '#006644' : '#172B4D' }}>
                                    {isJiraConnected ? 'Jira Connected' : 'Jira Not Connected'}
                                </span>
                                {jiraSiteName && (
                                    <span style={{ marginLeft: '8px', color: '#006644', fontSize: '14px' }}>
                                        — {jiraSiteName}
                                    </span>
                                )}
                            </div>
                        </div>
                        {!isJiraConnected && (
                            <button
                                onClick={handleConnectJira}
                                style={{
                                    padding: '8px 16px',
                                    background: '#0052CC',
                                    color: 'white',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500
                                }}
                            >
                                🔗 Connect Jira
                            </button>
                        )}
                        {isJiraConnected && (
                            <button
                                onClick={handleConnectJira}
                                style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    color: '#0052CC',
                                    borderRadius: '4px',
                                    border: '1px solid #0052CC',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Reconnect
                            </button>
                        )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Epics & User Stories</h2>
                    </div>

                    {/* Import by Jira Key */}
                    {isJiraConnected && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '16px',
                            padding: '16px',
                            background: colors.neutral[50],
                            borderRadius: '12px',
                            border: `1px solid ${colors.neutral[200]}`
                        }}>
                            <input
                                type="text"
                                value={importKey}
                                onChange={(e) => setImportKey(e.target.value)}
                                placeholder="Enter Jira key (e.g., KB-11643)"
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: `1px solid ${colors.neutral[200]}`,
                                    fontSize: '14px'
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleImportByKey()}
                            />
                            <button
                                onClick={handleImportByKey}
                                disabled={actionLoading || !importKey.trim()}
                                style={{
                                    padding: '10px 20px',
                                    background: '#0052CC',
                                    color: 'white',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    opacity: (!importKey.trim() || actionLoading) ? 0.5 : 1
                                }}
                            >
                                📥 Import
                            </button>
                        </div>
                    )}

                    {features.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: colors.neutral[50], borderRadius: '12px' }}>
                            <p style={{ color: colors.text.secondary }}>No epics or user stories yet. Import from Jira by key.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {features.map(feature => (
                                <div
                                    key={feature.id}
                                    onClick={() => navigate(`/stories/${feature.id}`)}
                                    style={{
                                        background: 'white',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: `1px solid ${colors.neutral[200]}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary[300]}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.neutral[200]}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            {feature.jira_type === 'epic' && (
                                                <span style={{ fontSize: '11px', background: '#6554C0', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                                                    Epic
                                                </span>
                                            )}
                                            {feature.jira_key && (
                                                <span style={{ fontSize: '12px', background: '#DEEBFF', color: '#0747A6', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                                                    {feature.jira_key}
                                                </span>
                                            )}
                                            <span style={{ fontWeight: 600 }}>{feature.name}</span>
                                        </div>
                                        <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>
                                            {feature.description?.substring(0, 100)}{feature.description && feature.description.length > 100 ? '...' : ''}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            {feature.test_case_count > 0 ? (
                                                <span style={{ fontSize: '12px', background: colors.secondary[50], color: colors.secondary[700], padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                                    {feature.test_case_count} Tests
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: colors.text.secondary }}>No tests</span>
                                            )}
                                            {feature.jira_status && (
                                                <span style={{ fontSize: '11px', color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {feature.jira_status}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                feature.jira_type === 'epic' ? handleBulkGenerateAI(feature.id) : handleGenerateAI(feature.id);
                                            }}
                                            disabled={actionLoading}
                                            style={{
                                                padding: '8px 12px',
                                                background: colors.primary[50],
                                                color: colors.primary[600],
                                                borderRadius: '8px',
                                                border: `1px solid ${colors.primary[200]}`,
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            {feature.jira_type === 'epic' ? 'Bulk AI' : 'Generate AI'}
                                        </button>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.neutral[400]} strokeWidth="2">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Test Cases Tab */}
            {activeTab === 'test-cases' && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: colors.text.secondary }}>Test Cases Generated: 0</p>
                    <p>Go to Epics & Stories tab to view stories and generate tests.</p>
                </div>
            )}
        </div>
    );
}

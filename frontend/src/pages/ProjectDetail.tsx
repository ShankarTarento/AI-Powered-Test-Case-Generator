import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import {
    apiClient,
    ProjectDetail as ProjectDetailType,
    Feature
} from '../services/api';
import { colors } from '../theme';

type TabType = 'overview' | 'features' | 'test-cases';

export default function ProjectDetail() {
    const { id } = useParams<{ id: string }>();


    // Data states
    const [project, setProject] = useState<ProjectDetailType | null>(null);

    const [features, setFeatures] = useState<Feature[]>([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('features');

    // Modal states
    const [showCreateFeatureModal, setShowCreateFeatureModal] = useState(false);

    // Form states
    const [newFeatureName, setNewFeatureName] = useState('');
    const [newFeatureDesc, setNewFeatureDesc] = useState('');

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
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---



    const handleCreateFeature = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await apiClient.createFeature(id!, {
                name: newFeatureName,
                description: newFeatureDesc,
                jira_type: 'story'
            });
            setShowCreateFeatureModal(false);
            setNewFeatureName('');
            setNewFeatureDesc('');
            loadProjectData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create feature');
        } finally {
            setActionLoading(false);
        }
    };



    const handleSyncJira = async () => {
        setActionLoading(true);
        try {
            const result = await apiClient.syncJiraFeatures(id!);
            loadProjectData();
            alert(result.message);
        } catch (err) {
            alert('Failed to sync with Jira');
        } finally {
            setActionLoading(false);
        }
    };

    const handleGenerateTestCases = async (featureId: string) => {
        if (!confirm('Generate test cases for this feature?')) return;
        try {
            await apiClient.generateTestCases(featureId);
            alert('Test cases generated successfully!');
        } catch (err) {
            alert('Failed to generate test cases');
        }
    };

    // --- Render Helpers ---

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

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },

        { id: 'features' as TabType, label: 'Features', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
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
                {/* Global Actions */}
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
                        Use the tabs above to manage sprints, import features from Jira, and generate test cases.
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



            {/* Features Tab */}
            {activeTab === 'features' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Features & Stories</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleSyncJira}
                                disabled={actionLoading}
                                style={{ padding: '8px 16px', background: 'white', color: '#0052CC', borderRadius: '8px', border: '1px solid #0052CC', cursor: 'pointer' }}
                            >
                                🔄 Sync Jira
                            </button>
                            <button
                                onClick={() => setShowCreateFeatureModal(true)}
                                style={{ padding: '8px 16px', background: colors.primary[600], color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                            >
                                + Add Feature
                            </button>
                        </div>
                    </div>

                    {features.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: colors.neutral[50], borderRadius: '12px' }}>
                            <p style={{ color: colors.text.secondary }}>No features yet. Sync from Jira or add manually.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {features.map(feature => (
                                <div key={feature.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: `1px solid ${colors.neutral[200]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
                                    <div>
                                        <button
                                            onClick={() => handleGenerateTestCases(feature.id)}
                                            style={{ padding: '8px 12px', background: colors.secondary[100], color: colors.secondary[700], borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                        >
                                            ⚡ Generate Tests
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Test Cases Tab Placeholder */}
            {activeTab === 'test-cases' && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: colors.text.secondary }}>Test Cases Generated: 0</p>
                    <p>Go to Features tab to generate tests from Jira stories.</p>
                </div>
            )}



            {/* Create Feature Modal */}
            {showCreateFeatureModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '500px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Add Feature / Story</h3>
                        <form onSubmit={handleCreateFeature}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Title</label>
                                <input
                                    value={newFeatureName}
                                    onChange={e => setNewFeatureName(e.target.value)}
                                    style={inputStyle}
                                    placeholder="e.g., User Login Flow"
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Description / User Story</label>
                                <textarea
                                    value={newFeatureDesc}
                                    onChange={e => setNewFeatureDesc(e.target.value)}
                                    style={{ ...inputStyle, minHeight: '100px' }}
                                    placeholder="As a user..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowCreateFeatureModal(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={actionLoading} style={{ padding: '8px 16px', background: colors.primary[600], color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

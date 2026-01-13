import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, UserStory, TestCase, BulkGenerateResult } from '../services/api';
import { colors } from '../theme';

export default function StoryDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [story, setStory] = useState<UserStory | null>(null);
    const [children, setChildren] = useState<UserStory[]>([]);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generating, setGenerating] = useState(false);
    const [bulkGenerating, setBulkGenerating] = useState(false);
    const [bulkResult, setBulkResult] = useState<BulkGenerateResult | null>(null);

    useEffect(() => {
        if (id) {
            loadStoryData();
        }
    }, [id]);

    const loadStoryData = async () => {
        try {
            const storyData = await apiClient.getUserStory(id!);
            setStory(storyData);

            // Load children if this is an Epic
            if (storyData.children) {
                setChildren(storyData.children);
            }

            // Load test cases
            try {
                const cases = await apiClient.getFeatureTestCases(id!);
                setTestCases(cases);
            } catch (e) {
                // No test cases yet
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load story');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTestCases = async () => {
        if (!confirm('Generate test cases for this story?')) return;
        setGenerating(true);
        try {
            const cases = await apiClient.generateTestCases(id!);
            setTestCases(cases);
            alert('Test cases generated successfully!');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to generate test cases');
        } finally {
            setGenerating(false);
        }
    };

    const handleBulkGenerateTestCases = async () => {
        if (!confirm(`Generate test cases for all ${children.length} child stories?`)) return;
        setBulkGenerating(true);
        setBulkResult(null);
        try {
            const result = await apiClient.bulkGenerateTestCases(id!);
            setBulkResult(result);
            alert(`Generated ${result.test_cases_generated} test cases for ${result.stories_processed} stories!`);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to bulk generate test cases');
        } finally {
            setBulkGenerating(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!story) return <div style={{ padding: '40px', textAlign: 'center' }}>Story not found</div>;

    const isEpic = story.jira_type === 'epic';

    return (
        <div>
            {/* Breadcrumb */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: colors.text.secondary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Back to Project
                </button>
            </div>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    {isEpic && (
                        <span style={{
                            fontSize: '12px',
                            background: '#6554C0',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                        }}>
                            Epic
                        </span>
                    )}
                    {story.jira_key && (
                        <span style={{
                            fontSize: '14px',
                            background: '#DEEBFF',
                            color: '#0747A6',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontWeight: 500
                        }}>
                            {story.jira_key}
                        </span>
                    )}
                    {story.jira_status && (
                        <span style={{
                            fontSize: '12px',
                            background: colors.neutral[100],
                            color: colors.text.secondary,
                            padding: '4px 10px',
                            borderRadius: '4px'
                        }}>
                            {story.jira_status}
                        </span>
                    )}
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.text.primary, marginBottom: '8px' }}>
                    {story.name}
                </h1>
            </div>

            {error && (
                <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left Column: Description */}
                <div style={{
                    background: colors.background.paper,
                    borderRadius: '12px',
                    padding: '24px',
                    border: `1px solid ${colors.neutral[200]}`
                }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Description</h2>
                    <div style={{
                        color: colors.text.secondary,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                    }}>
                        {story.description || 'No description available.'}
                    </div>
                </div>

                {/* Right Column: Actions & Test Cases */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Generate Test Cases Button */}
                    {!isEpic && (
                        <div style={{
                            background: colors.background.paper,
                            borderRadius: '12px',
                            padding: '20px',
                            border: `1px solid ${colors.neutral[200]}`
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Test Cases</h3>
                            <button
                                onClick={handleGenerateTestCases}
                                disabled={generating}
                                style={{
                                    width: '100%',
                                    padding: '12px 20px',
                                    background: `linear-gradient(135deg, ${colors.secondary[500]} 0%, ${colors.secondary[700]} 100%)`,
                                    color: 'white',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    opacity: generating ? 0.7 : 1
                                }}
                            >
                                {generating ? '⏳ Generating...' : '⚡ Generate Test Cases'}
                            </button>

                            {testCases.length > 0 && (
                                <div style={{ marginTop: '16px' }}>
                                    <p style={{ fontSize: '14px', color: colors.text.secondary, marginBottom: '8px' }}>
                                        {testCases.length} test case(s) generated
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {testCases.map(tc => (
                                            <div key={tc.id} style={{
                                                padding: '12px',
                                                background: colors.neutral[50],
                                                borderRadius: '8px',
                                                border: `1px solid ${colors.neutral[200]}`
                                            }}>
                                                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{tc.title}</div>
                                                <div style={{ fontSize: '12px', color: colors.text.secondary }}>
                                                    Priority: {tc.priority} | Type: {tc.test_type}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Child Stories (if Epic) */}
            {isEpic && (
                <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                            Linked User Stories ({children.length})
                        </h2>
                        {children.length > 0 && (
                            <button
                                onClick={handleBulkGenerateTestCases}
                                disabled={bulkGenerating}
                                style={{
                                    padding: '10px 20px',
                                    background: `linear-gradient(135deg, #6554C0 0%, #5243AA 100%)`,
                                    color: 'white',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    opacity: bulkGenerating ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {bulkGenerating ? (
                                    <>⏳ Generating...</>
                                ) : (
                                    <>⚡ Bulk Generate Test Cases</>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Bulk Generate Results */}
                    {bulkResult && (
                        <div style={{
                            padding: '16px',
                            background: '#E3FCEF',
                            borderRadius: '8px',
                            border: '1px solid #36B37E',
                            marginBottom: '16px'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#006644' }}>
                                ✅ Bulk Generation Complete
                            </div>
                            <div style={{ fontSize: '14px', color: '#006644' }}>
                                Generated {bulkResult.test_cases_generated} test cases for {bulkResult.stories_processed} of {bulkResult.total_stories} stories
                            </div>
                            {bulkResult.stories.filter(s => s.status === 'skipped').length > 0 && (
                                <div style={{ fontSize: '12px', color: '#856404', marginTop: '8px' }}>
                                    {bulkResult.stories.filter(s => s.status === 'skipped').length} stories skipped (already have test cases)
                                </div>
                            )}
                        </div>
                    )}

                    {children.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            background: colors.neutral[50],
                            borderRadius: '12px',
                            border: `1px solid ${colors.neutral[200]}`
                        }}>
                            <p style={{ color: colors.text.secondary }}>
                                No linked user stories found. Import child stories from Jira.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {children.map(child => (
                                <div
                                    key={child.id}
                                    onClick={() => navigate(`/stories/${child.id}`)}
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
                                            <span style={{
                                                fontSize: '11px',
                                                background: '#36B37E',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 600
                                            }}>
                                                Story
                                            </span>
                                            {child.jira_key && (
                                                <span style={{ fontSize: '12px', background: '#DEEBFF', color: '#0747A6', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                                                    {child.jira_key}
                                                </span>
                                            )}
                                            <span style={{ fontWeight: 600 }}>{child.name}</span>
                                        </div>
                                        <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>
                                            {child.description?.substring(0, 100)}{child.description && child.description.length > 100 ? '...' : ''}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {child.jira_status && (
                                            <span style={{ fontSize: '12px', background: colors.neutral[100], color: colors.text.secondary, padding: '4px 8px', borderRadius: '4px' }}>
                                                {child.jira_status}
                                            </span>
                                        )}
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
        </div>
    );
}

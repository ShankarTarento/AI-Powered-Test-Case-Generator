import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Project } from '../services/api';
import { colors } from '../theme';

export default function Projects() {
    const { isAdmin } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', jira_project_key: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await apiClient.getProjects();
            setProjects(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.name.trim()) return;

        setCreating(true);
        try {
            await apiClient.createProject({
                name: newProject.name,
                description: newProject.description || undefined,
                jira_project_key: newProject.jira_project_key || undefined
            });
            setShowCreateModal(false);
            setNewProject({ name: '', description: '', jira_project_key: '' });
            loadProjects();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
        } finally {
            setCreating(false);
        }
    };

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

    if (loading) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <p style={{ color: colors.text.secondary }}>Loading projects...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.text.primary, marginBottom: '4px' }}>
                        Projects
                    </h1>
                    <p style={{ color: colors.text.secondary, margin: 0 }}>
                        {isAdmin ? 'Manage all projects' : 'Your assigned projects'}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New Project
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF2F2',
                    border: `1px solid ${colors.error.light}`,
                    marginBottom: '24px'
                }}>
                    <p style={{ color: colors.error.main, margin: 0 }}>{error}</p>
                </div>
            )}

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div style={{
                    padding: '48px',
                    textAlign: 'center',
                    backgroundColor: colors.background.paper,
                    borderRadius: '12px',
                    border: `1px solid ${colors.neutral[200]}`
                }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.neutral[300]} strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p style={{ color: colors.text.secondary, marginBottom: '16px' }}>
                        {isAdmin ? 'No projects yet. Create your first project!' : 'You have not been assigned to any projects yet.'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            style={{
                                textDecoration: 'none',
                                backgroundColor: colors.background.paper,
                                borderRadius: '12px',
                                padding: '24px',
                                border: `1px solid ${colors.neutral[200]}`,
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: colors.primary[100],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.primary[600]} strokeWidth="2">
                                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: colors.text.primary,
                                        marginBottom: '4px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {project.name}
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        color: colors.text.secondary,
                                        margin: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {project.description || 'No description'}
                                    </p>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: `1px solid ${colors.neutral[100]}`
                            }}>
                                <span style={{ fontSize: '12px', color: colors.text.secondary }}>
                                    {project.member_count || 0} members
                                </span>
                                {project.jira_project_key && (
                                    <span style={{
                                        fontSize: '12px',
                                        color: colors.primary[600],
                                        backgroundColor: colors.primary[50],
                                        padding: '2px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        {project.jira_project_key}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: colors.background.default,
                        borderRadius: '16px',
                        padding: '32px',
                        width: '100%',
                        maxWidth: '480px',
                        margin: '16px'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: colors.text.primary, marginBottom: '24px' }}>
                            Create New Project
                        </h2>
                        <form onSubmit={handleCreateProject}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Project Name *</label>
                                <input
                                    type="text"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    style={inputStyle}
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Description</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                    placeholder="Enter project description"
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={labelStyle}>Jira Project Key</label>
                                <input
                                    type="text"
                                    value={newProject.jira_project_key}
                                    onChange={(e) => setNewProject({ ...newProject, jira_project_key: e.target.value })}
                                    style={inputStyle}
                                    placeholder="e.g., PROJ"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: `1px solid ${colors.neutral[200]}`,
                                        backgroundColor: colors.background.paper,
                                        color: colors.text.secondary,
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: creating ? 'not-allowed' : 'pointer',
                                        opacity: creating ? 0.5 : 1
                                    }}
                                >
                                    {creating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { colors } from '../theme';
import { apiClient, Project, KnowledgeBatch } from '../services/api';

export default function KnowledgeBase() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [batches, setBatches] = useState<KnowledgeBatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadBatches();
        }
    }, [selectedProject]);

    const loadProjects = async () => {
        try {
            const data = await apiClient.getProjects();
            setProjects(data);
            if (data.length > 0) {
                setSelectedProject(data[0].id);
            }
        } catch (err) {
            console.error('Failed to load projects', err);
        }
    };

    const loadBatches = async () => {
        if (!selectedProject) return;
        setLoading(true);
        try {
            const data = await apiClient.listKnowledgeBatches(selectedProject);
            setBatches(data);
        } catch (err) {
            console.error('Failed to load batches', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File) => {
        if (!selectedProject) {
            setMessage({ type: 'error', text: 'Please select a project first' });
            return;
        }

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
            setMessage({ type: 'error', text: 'Only CSV and Excel files are supported' });
            return;
        }

        setUploading(true);
        setMessage(null);
        try {
            await apiClient.uploadKnowledgeBatch(selectedProject, file);
            setMessage({ type: 'success', text: `Successfully uploaded ${file.name}!` });
            loadBatches();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; color: string }> = {
            completed: { bg: colors.success.light, color: colors.success.dark },
            processing: { bg: colors.warning.light, color: colors.warning.dark },
            pending: { bg: colors.neutral[200], color: colors.neutral[600] },
            failed: { bg: colors.error.light, color: colors.error.dark },
        };
        const style = styles[status] || styles.pending;
        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                backgroundColor: style.bg,
                color: style.color
            }}>
                {status}
            </span>
        );
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1000px' }}>
            <h1 style={{ color: colors.text.primary, marginBottom: '8px' }}>Knowledge Base</h1>
            <p style={{ color: colors.text.secondary, marginBottom: '24px' }}>
                Upload historical test cases to improve AI generation accuracy through RAG.
            </p>

            {/* Project Selector */}
            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                    Select Project
                </label>
                <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${colors.neutral[300]}`,
                        fontSize: '14px',
                        minWidth: '300px',
                        backgroundColor: 'white'
                    }}
                >
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Upload Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    padding: '48px',
                    textAlign: 'center',
                    backgroundColor: dragActive ? colors.primary[50] : colors.background.paper,
                    borderRadius: '12px',
                    border: `2px dashed ${dragActive ? colors.primary[400] : colors.neutral[300]}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '24px'
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.neutral[400]} strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p style={{ fontSize: '16px', fontWeight: 500, color: colors.text.primary, marginBottom: '4px' }}>
                    {uploading ? 'Uploading...' : 'Drag & drop your file here'}
                </p>
                <p style={{ fontSize: '14px', color: colors.text.secondary }}>
                    or click to browse • CSV, Excel files supported
                </p>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    backgroundColor: message.type === 'success' ? '#E3FCEF' : '#FEE2E2',
                    color: message.type === 'success' ? '#006644' : '#B91C1C'
                }}>
                    {message.text}
                </div>
            )}

            {/* Batches List */}
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Uploaded Batches</h2>
            {loading ? (
                <p style={{ color: colors.text.secondary }}>Loading...</p>
            ) : batches.length === 0 ? (
                <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    backgroundColor: colors.neutral[50],
                    borderRadius: '12px',
                    color: colors.text.secondary
                }}>
                    No knowledge batches uploaded yet for this project.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {batches.map(batch => (
                        <div key={batch.id} style={{
                            padding: '16px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: `1px solid ${colors.neutral[200]}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600 }}>{batch.file_name}</span>
                                    {getStatusBadge(batch.status)}
                                </div>
                                <p style={{ fontSize: '13px', color: colors.text.secondary, margin: 0 }}>
                                    {batch.indexed_rows} of {batch.total_rows} entries indexed •
                                    {(batch.file_size_bytes / 1024).toFixed(1)} KB •
                                    {new Date(batch.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: colors.text.secondary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {batch.file_type}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

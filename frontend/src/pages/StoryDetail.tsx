import { colors } from '../theme';

export default function StoryDetail() {
    return (
        <div style={{ padding: '32px' }}>
            <h1 style={{ color: colors.text.primary, marginBottom: '8px' }}>Story Details</h1>
            <p style={{ color: colors.text.secondary }}>
                View and manage test cases for this specific story.
            </p>
        </div>
    );
}

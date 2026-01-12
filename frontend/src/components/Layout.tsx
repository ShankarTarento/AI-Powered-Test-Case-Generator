import { Outlet } from 'react-router-dom';
import { colors } from '../theme';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: colors.background.default }}>
            <Header />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '24px' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

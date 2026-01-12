import { Link, useLocation } from 'react-router-dom'
import { Home, Settings, BarChart3, FileText } from 'lucide-react'

export default function Sidebar() {
    const location = useLocation()

    const links = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/test-cases', icon: FileText, label: 'Test Cases' },
        { path: '/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
            <nav className="p-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = location.pathname === link.path

                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary-50 text-primary-600 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <Icon size={20} />
                            {link.label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}

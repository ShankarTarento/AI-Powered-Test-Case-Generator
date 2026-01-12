export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-primary-600">
                    AI Test Case Generator
                </h1>
                <div className="flex items-center gap-4">
                    <button className="btn-secondary">
                        Profile
                    </button>
                </div>
            </div>
        </header>
    )
}

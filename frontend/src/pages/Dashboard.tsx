export default function Dashboard() {
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card">
                    <h3 className="text-gray-600 text-sm font-medium mb-2">Total Test Cases</h3>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-500 mt-1">Coming soon</p>
                </div>

                <div className="card">
                    <h3 className="text-gray-600 text-sm font-medium mb-2">AI Generated</h3>
                    <p className="text-3xl font-bold text-primary-600">0</p>
                    <p className="text-sm text-gray-500 mt-1">0% of total</p>
                </div>

                <div className="card">
                    <h3 className="text-gray-600 text-sm font-medium mb-2">Time Saved</h3>
                    <p className="text-3xl font-bold text-green-600">0h</p>
                    <p className="text-sm text-gray-500 mt-1">Est. manual effort</p>
                </div>
            </div>

            <div className="card">
                <h3 className="text-xl font-semibold mb-4">Welcome to AI Test Case Generator! 🚀</h3>
                <p className="text-gray-600 mb-4">
                    Get started by connecting your Jira account and configuring your AI provider.
                </p>
                <div className="flex gap-3">
                    <button className="btn-primary">
                        Connect Jira
                    </button>
                    <button className="btn-secondary">
                        Configure AI
                    </button>
                </div>
            </div>
        </div>
    )
}

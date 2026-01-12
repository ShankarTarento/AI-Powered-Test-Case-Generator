export default function Settings() {
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Settings</h2>

            <div className="space-y-6">
                <div className="card">
                    <h3 className="text-xl font-semibold mb-4">AI Provider Configuration</h3>
                    <p className="text-gray-600 mb-4">
                        Configure your AI provider and API keys. Your keys are encrypted and never shared.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Primary Provider</label>
                            <select className="input">
                                <option>OpenAI</option>
                                <option>Anthropic</option>
                                <option>Google</option>
                                <option>Azure OpenAI</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">API Key</label>
                            <input type="password" className="input" placeholder="sk-..." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Model</label>
                            <select className="input">
                                <option>GPT-4 Turbo</option>
                                <option>GPT-4o</option>
                                <option>GPT-3.5 Turbo</option>
                            </select>
                        </div>

                        <button className="btn-primary">
                            Save Configuration
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-xl font-semibold mb-4">Jira Integration</h3>
                    <p className="text-gray-600 mb-4">
                        Connect your Jira account to sync user stories and test cases.
                    </p>
                    <button className="btn-primary">
                        Connect Jira
                    </button>
                </div>
            </div>
        </div>
    )
}

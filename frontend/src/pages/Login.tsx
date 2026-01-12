export default function Login() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="card max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input type="email" className="input" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input type="password" className="input" placeholder="••••••••" />
                    </div>
                    <button type="submit" className="btn-primary w-full">
                        Sign In
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">Or sign in with</p>
                    <div className="flex gap-3 mt-3">
                        <button className="btn-secondary flex-1">Google</button>
                        <button className="btn-secondary flex-1">Azure AD</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

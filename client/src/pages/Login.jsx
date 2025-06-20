import { useContext, useState } from 'react'
import { AuthContext }        from '../context/AuthContext'
import { useNavigate, Link }  from 'react-router-dom'

/**
 * Login component for user authentication
 * Allows users to sign in with email and password
 */
export default function Login() {
    const { login } = useContext(AuthContext)
    const navigate  = useNavigate()
    const [form, setForm]    = useState({ email: '', password: '' })
    const [error, setError]  = useState(null)

    /**
     * Attempts to log in the user
     * On success, redirects to the products page
     */
    async function handleSubmit() {
        try {
            await login(form.email, form.password)
            navigate('/')
        } catch (e) {
            setError(e.response?.data?.error || 'Login failed')
        }
    }

    return (
        <div className="h-screen flex items-center justify-center">
            <div className="w-full max-w-sm space-y-4">
                <h1 className="text-2xl font-bold text-center">Login</h1>

                <input
                    className="border p-2 w-full"
                    placeholder="Email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                />

                <input
                    className="border p-2 w-full"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                />

                {error && <p className="text-red-600 text-center">{error}</p>}

                <button
                    className="w-full bg-blue-600 text-white py-2 rounded"
                    onClick={handleSubmit}
                >
                    Sign In
                </button>

                <p className="text-center text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    )
}

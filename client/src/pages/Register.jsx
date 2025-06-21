// client/src/pages/Register.jsx
import { useContext, useState } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

/**
 * Register component for user registration
 * Allows users to create a new account with personal details
 */
export default function Register() {
    const { login } = useContext(AuthContext)
    const navigate = useNavigate()

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        weight: '',
        height: '',
        age: '',
        goal: 'lose',
        gender: '',
        activity_level: 'sedentary'
    })
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState(null)

    /**
     * Validates the registration form
     * @returns {Object} Object containing validation errors
     */
    function validate() {
        const errs = {}
        if (!form.name.trim()) errs.name = 'Name is required'
        if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required'
        if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
        if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords must match'
        ['weight','height','age'].forEach(key => {
            const v = Number(form[key])
            if (!v || v <= 0) errs[key] = 'Must be a positive number'
        })
        if (!form.gender) errs.gender = 'Gender is required'
        if (!form.activity_level) errs.activity_level = 'Activity level is required'
        return errs
    }

    /**
     * Handles form submission for user registration
     * @param {Event} e - Form submit event
     * Handles server-side errors and maps them to specific fields if possible
     */
    async function handleSubmit(e) {
        e.preventDefault()
        setServerError(null)
        const validation = validate()
        if (Object.keys(validation).length) {
            setErrors(validation)
            return
        }
        try {
            await axios.post('/api/auth/register', {
                name: form.name,
                email: form.email,
                password: form.password,
                weight: Number(form.weight),
                height: Number(form.height),
                age: Number(form.age),
                goal: form.goal,
                gender: form.gender,
                activity_level: form.activity_level
            })
            // login immediately after registration
            await login(form.email, form.password)
            navigate('/')
        } catch (err) {
            const msg = err.response?.data?.error
            if (err.response?.status === 409) {
                setErrors({ email: 'Email already in use' })
            } else if (msg && msg.toLowerCase().includes('password')) {
                setErrors({ password: msg })
            } else {
                setServerError(msg || 'Registration failed')
            }
        }
    }

    /**
     * Handles changes in form inputs
     * @param {Event} e - Input change event
     */
    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        setErrors(prev => ({ ...prev, [name]: null }))
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-md rounded-lg w-full max-w-lg p-8 space-y-6"
            >
                <h1 className="text-2xl font-semibold text-center">Create Account</h1>

                {/* Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Name</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                            placeholder="Your name"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Email</label>
                        <input
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                            placeholder="you@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['weight','height','age'].map(key => (
                        <div key={key}>
                            <label className="block mb-1 text-sm font-medium capitalize">{key}</label>
                            <input
                                type="number"
                                name={key}
                                value={form[key]}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                                placeholder={key === 'age' ? 'years' : key === 'weight' ? 'kg' : 'cm'}
                            />
                            {errors[key] && <p className="text-red-500 text-sm mt-1">{errors[key]}</p>}
                        </div>
                    ))}
                </div>

                {/* Goal */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Goal</label>
                    <select
                        name="goal"
                        value={form.goal}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="lose">Lose Weight</option>
                        <option value="gain">Gain Weight</option>
                        <option value="maintain">Maintain Weight</option>
                    </select>
                </div>

                {/* Gender */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Gender</label>
                    <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                </div>

                {/* Activity Level */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Activity Level</label>
                    <select
                        name="activity_level"
                        value={form.activity_level}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="sedentary">Sedentary (little or no exercise)</option>
                        <option value="light">Lightly Active (light exercise/sports 1-3 days/wk)</option>
                        <option value="moderate">Moderately Active (moderate exercise/sports 3-5 days/wk)</option>
                        <option value="active">Active (hard exercise/sports 6-7 days/wk)</option>
                        <option value="very_active">Very Active (very hard exercise & physical job)</option>
                    </select>
                    {errors.activity_level && <p className="text-red-500 text-sm mt-1">{errors.activity_level}</p>}
                </div>

                {serverError && <p className="text-red-600 text-center">{serverError}</p>}

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                >
                    Register
                </button>

                <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    )
}

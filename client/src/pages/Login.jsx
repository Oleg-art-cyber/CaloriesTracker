import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


export default function Login() {
    const { login } = useContext(AuthContext);
    const navigate  = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [err,  setErr ] = useState(null);

    async function submit() {
        try {
            await login(form.email, form.password);
            navigate('/');             // go to products
        } catch (e) {
            setErr(e.response?.data?.error || 'Login failed');
        }
    }

    return (
        <div className="h-screen flex items-center justify-center">
            <div className="w-full max-w-sm space-y-3">
                <h1 className="text-2xl font-bold text-center">Login</h1>

                <input className="border p-2 w-full"
                       placeholder="email"
                       value={form.email}
                       onChange={e => setForm({ ...form, email: e.target.value })} />

                <input className="border p-2 w-full"
                       type="password"
                       placeholder="password"
                       value={form.password}
                       onChange={e => setForm({ ...form, password: e.target.value })} />

                {err && <p className="text-red-600">{err}</p>}

                <button className="w-full bg-blue-600 text-white py-2 rounded"
                        onClick={submit}>
                    Sign in
                </button>
            </div>
        </div>
    );
}

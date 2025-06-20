import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);

    /* try to reuse token on page reload */
    useEffect(() => {
        const saved = localStorage.getItem('jwt');
        if (saved) {
            setToken(saved);
            axios.defaults.headers.common.Authorization = `Bearer ${saved}`;
        }
    }, []);

    /* login action */
    async function login(email, password) {
        const { data } = await axios.post('/api/auth/login', { email, password });
        setToken(data.token);
        localStorage.setItem('jwt', data.token);
        axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    }

    function logout() {
        setToken(null);
        localStorage.removeItem('jwt');
        delete axios.defaults.headers.common.Authorization;
    }

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

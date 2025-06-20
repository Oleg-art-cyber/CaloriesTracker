// client/src/hooks/useCategories.js
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function useCategories() {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get('/api/categories', { headers: authHeader })
            .then(r => setCats(r.data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [token]);

    return { cats, loading };
}

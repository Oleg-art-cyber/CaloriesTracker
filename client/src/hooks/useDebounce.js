// client/src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export default function useDebounce(value, delay = 500) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

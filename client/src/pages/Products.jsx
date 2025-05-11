import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AddProduct from '../components/AddProduct';

/**
 * Products page
 * – shows list (GET /products)
 * – admins see “＋ Add” button to create product (POST /products)
 */
export default function Products() {
    const { token } = useContext(AuthContext);

    const [list,   setList]   = useState([]);   // always an array
    const [error,  setError]  = useState(null); // string | null
    const [adding, setAdding] = useState(false);

    /* ----- helpers ----- */

    // (re)load products from API
    const fetchProducts = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/products`
            );
            // ensure we keep array shape
            setList(Array.isArray(data) ? data : []);
            setError(null);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || 'Server error');
            setList([]); // fallback to empty list so .map is safe
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Decode role from JWT  (simple client-side check)
    const isAdmin =
        token && JSON.parse(atob(token.split('.')[1])).role === 'admin';

    /* ----- render ----- */

    return (
        <div className="p-6">
            <header className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Products</h2>

                {isAdmin && (
                    <button
                        onClick={() => setAdding(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                        ＋ Add
                    </button>
                )}
            </header>

            {error && (
                <p className="text-red-600 mb-4">
                    {error}
                </p>
            )}

            <ul className="space-y-1">
                {list.map(p => (
                    <li
                        key={p.id}
                        className="border rounded p-2 flex justify-between items-center"
                    >
                        <span>{p.name}</span>
                        <span className="text-sm text-gray-500">{p.calories} kcal</span>
                    </li>
                ))}
            </ul>

            {adding && (
                <AddProduct
                    onSuccess={fetchProducts}      // refresh list after save
                    onClose={() => setAdding(false)}
                />
            )}
        </div>
    );
}

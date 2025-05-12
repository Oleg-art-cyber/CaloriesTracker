// client/src/pages/Products.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ProductForm from '../components/ProductForm';

export default function Products() {
    const { token } = useContext(AuthContext);

    // decode JWT once
    const payload = token ? JSON.parse(atob(token.split('.')[1])) : {};
    const isAdmin = payload.role === 'admin';
    const userId  = payload.id;

    const [list,    setList]    = useState([]);
    const [error,   setError]   = useState(null);
    const [adding, setAdding]   = useState(false);
    const [editing, setEditing] = useState(null);

    // fetch all products (server already filters by public/owned)
    const fetchProducts = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/products`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setList(Array.isArray(data) ? data : []);
            setError(null);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || 'Server error');
            setList([]);
        }
    };

    useEffect(() => {
        if (token) fetchProducts();
    }, [token]);

    // delete handler
    const handleDelete = async id => {
        if (!confirm('Delete product?')) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/products/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchProducts();
        } catch (e) {
            console.error(e);
            alert('Delete error');
        }
    };

    return (
        <div className="p-6">
            <header className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Products</h2>

                {/* Add button for any logged-in user */}
                {token && (
                    <button
                        onClick={() => setAdding(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                        ＋ Add
                    </button>
                )}
            </header>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            <ul className="space-y-1">
                {list.map(p => (
                    <li
                        key={p.id}
                        className="border rounded p-2 flex justify-between items-center"
                    >
                        <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-sm text-gray-500">
                                {p.calories} kcal  · {p.fat} fat  · {p.protein} protein  · {p.carbs} carbs
                                {p.category && (
                                    <> · <span className="italic">{p.category}</span></>
                                )}
                            </p>
                        </div>

                        {/* Edit/Delete only for admin or owner */}
                        {(isAdmin || p.created_by === userId) && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditing(p)}
                                    className="text-blue-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="text-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {/* Add modal */}
            {adding && (
                <ProductForm
                    onSuccess={fetchProducts}
                    onClose={() => setAdding(false)}
                />
            )}

            {/* Edit modal */}
            {editing && (
                <ProductForm
                    product={editing}
                    onSuccess={fetchProducts}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}

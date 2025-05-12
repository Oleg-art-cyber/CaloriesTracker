import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ProductForm from '../components/ProductForm';

export default function Products() {
    const { token } = useContext(AuthContext);
    const isAdmin =
        token && JSON.parse(atob(token.split('.')[1])).role === 'admin';

    const [list, setList]     = useState([]);
    const [error, setError]   = useState(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState(null);

    /* fetch all products */
    const fetchProducts = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
            setList(Array.isArray(data) ? data : []);
            setError(null);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || 'Server error');
            setList([]);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    /* delete single product */
    const handleDelete = async id => {
        if (!confirm('Delete product?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);
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

                {isAdmin && (
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
                                {p.calories} kcal
                                {p.category && (
                                    <> &middot; <span className="italic">{p.category}</span></>
                                )}
                            </p>
                        </div>

                        {isAdmin && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditing(p)}
                                    className="text-blue-600">
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="text-red-600">
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
                    product={editing}          // editing product has category_id
                    onSuccess={fetchProducts}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}

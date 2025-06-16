// client/src/pages/Products.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ProductForm from '../components/ProductForm';
import CategoryBadge from '../components/CategoryBadge';
import useCategories from '../hooks/useCategories';
import useDebounce from '../hooks/useDebounce';
import Pagination from '../components/Pagination';

/**
 * Products page component for managing food products
 * Displays a list of products with search, pagination, and CRUD operations
 */
export default function Products() {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    // Extract user role and ID from JWT token
    const payload  = token ? JSON.parse(atob(token.split('.')[1])) : {};
    const isAdmin  = payload.role === 'admin';
    const userId   = payload.id;

    // Get categories for product classification
    const { cats } = useCategories();
    const catName = id => cats.find(c => c.id === id)?.name;

    // State for product list and error handling
    const [list,  setList ] = useState([]);
    const [error, setError] = useState(null);

    // Search and pagination state
    const [q,    setQ   ] = useState('');
    const debQ = useDebounce(q, 400);

    const [page,  setPage ] = useState(1);
    const limit = 10;
    const [total, setTotal] = useState(0);

    // Modal state for adding and editing products
    const [adding,  setAdding ] = useState(false);
    const [editing, setEditing] = useState(null);

    /**
     * Fetches a paginated list of products from the server
     * @param {number} p - Page number to fetch
     */
    const fetchProducts = async (p = page) => {
        try {
            const { data } = await axios.get('/api/products', {
                headers: authHeader,
                params : { q: debQ, page: p, limit }
            });
            setList(data.data);
            setTotal(data.total);
            setPage(data.page);
            setError(null);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || 'Server error');
            setList([]);
        }
    };

    // Fetch products on initial load and when search query changes
    useEffect(() => {
        if (token) fetchProducts(1);   // Reset to first page on new search
    }, [token, debQ]);

    /**
     * Handles product deletion with confirmation
     * @param {number} id - ID of the product to delete
     */
    const handleDelete = async id => {
        if (!confirm('Delete product?')) return;
        try {
            await axios.delete(`/api/products/${id}`, { headers: authHeader });
            fetchProducts();             // Reload current page
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.error || 'Delete error');
        }
    };

    return (
        <div className="p-6">
            <header className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Products</h2>
                {token && (
                    <button
                        onClick={() => setAdding(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                        ＋ Add
                    </button>
                )}
            </header>

            {/* search */}
            <input
                type="text"
                placeholder="Search..."
                value={q}
                onChange={e => setQ(e.target.value)}
                className="mb-4 w-full max-w-xs border rounded px-3 py-1"
            />

            {error && <p className="text-red-600 mb-4">{error}</p>}

            <ul className="space-y-2">
                {list.map(p => {
                    const canModify = isAdmin || p.created_by === userId;
                    return (
                        <li
                            key={p.id}
                            className="flex justify-between items-center border p-3 rounded"
                        >
                            <div>
                                <p className="font-medium">{p.name}</p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <span>{p.calories} kcal</span>
                                    <CategoryBadge name={catName(p.category_id)} />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => canModify && setEditing(p)}
                                    disabled={!canModify}
                                    className={`text-blue-600 px-2 py-1 rounded ${
                                        !canModify
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-blue-100'
                                    }`}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => canModify && handleDelete(p.id)}
                                    disabled={!canModify}
                                    className={`text-red-600 px-2 py-1 rounded ${
                                        !canModify
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-red-100'
                                    }`}
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {/* pagination */}
            <Pagination
                page={page}
                total={total}
                limit={limit}
                onPage={p => fetchProducts(p)}
            />

            {/* modals */}
            {adding && (
                <ProductForm
                    onSuccess={() => fetchProducts(1)}
                    onClose={() => setAdding(false)}
                />
            )}
            {editing && (
                <ProductForm
                    product={editing}
                    onSuccess={() => fetchProducts(page)}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}

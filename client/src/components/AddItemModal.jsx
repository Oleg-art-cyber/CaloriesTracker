// client/src/components/ProductSelectorModal.jsx
import { useEffect, useState, useContext } from 'react';
import axios                               from 'axios';
import { AuthContext }                     from '../context/AuthContext';

// Modal for selecting a product with client-side search
export default function ProductSelectorModal({ type, date, close }) {
    const { token } = useContext(AuthContext);

    /* state ------------------------------------------------------- */
    const [products, setProducts] = useState([]);   // full list from server
    const [search,   setSearch]   = useState('');   // search term
    const [productId,setId]       = useState('');   // chosen id
    const [weight,   setWeight]   = useState(100);
    const [error,    setError]    = useState('');

    /* load complete product list --------------------------------- */
    useEffect(() => {
        axios
            .get('/api/products', {
                params:  { limit: 10000 },               // ask server for “all rows”
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(r => {
                const raw = r.data;
                const arr =
                    Array.isArray(raw)           ? raw :
                        Array.isArray(raw?.products) ? raw.products :
                            Array.isArray(raw?.data)     ? raw.data : [];
                setProducts(arr);
            })
            .catch(e => {
                console.error('GET /api/products failed:', e);
                setError('Could not load product list');
            });
    }, [token]);

    /* handlers ---------------------------------------------------- */
    const add = async () => {
        if (!productId) {
            setError('Pick a product first');
            return;
        }
        try {
            await axios.post(
                `/api/diary/${type}`,
                { date, items: [{ productId: Number(productId), amount: Number(weight) }] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            close();
        } catch (e) {
            console.error('POST /api/diary failed:', e);
            setError(e.response?.data?.error || 'Server error – see console');
        }
    };

    /* derived list after filtering ------------------------------- */
    const filtered =
        search.trim() === ''
            ? products
            : products.filter(p =>
                p.name.toLowerCase().includes(search.toLowerCase())
            );

    /* render ------------------------------------------------------ */
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-xl w-80 space-y-3">
                <h4 className="font-medium">Add product</h4>

                {/* search box */}
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full border p-1 rounded"
                />

                {/* product selector */}
                <select
                    className="w-full border p-1 rounded"
                    size="6"
                    value={productId}
                    onChange={e => {
                        setId(e.target.value);
                        setError('');
                    }}
                >
                    {filtered.length === 0 && (
                        <option disabled>(no matches)</option>
                    )}
                    {filtered.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} ({p.calories} kcal)
                        </option>
                    ))}
                </select>

                {/* amount input */}
                <input
                    type="number"
                    min="1"
                    className="w-full border p-1 rounded"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                {/* footer */}
                <div className="flex justify-end gap-2">
                    <button onClick={close} className="px-3 py-1 border rounded">
                        Cancel
                    </button>
                    <button
                        onClick={add}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}

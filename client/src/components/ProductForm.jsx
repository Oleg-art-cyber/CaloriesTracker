// client/src/components/ProductForm.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductForm({ product, onSuccess, onClose }) {
    /* ----- local state ----- */
    const [cats, setCats] = useState([]);       // category list [{id,label,name}]
    const [form, setForm] = useState({
        name: '', calories: '', fat: '', protein: '', carbs: '', category_id: null
    });
    const [err, setErr] = useState(null);

    /* ----- fetch categories once ----- */
    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/categories`)
            .then(r => {
                setCats(r.data);                               // save list
                const other = r.data.find(c => c.name === 'other');
                setForm(f => ({ ...f, category_id: other?.id || r.data[0].id }));
            })
            .catch(console.error);
    }, []);

    /* ----- pre-fill when editing ----- */
    useEffect(() => {
        if (product && cats.length) {
            const { name, calories, fat, protein, carbs, category_id } = product;
            setForm({
                name,
                calories: String(calories),
                fat: String(fat),
                protein: String(protein),
                carbs: String(carbs),
                category_id: category_id || cats.find(c => c.name === 'other').id
            });
        }
    }, [product, cats]);

    /* ----- helpers ----- */
    const handle = e => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: name === 'category_id' ? Number(value) : value });
    };

    const submit = async () => {
        const payload = {
            name: form.name,
            calories: +form.calories,
            fat: +form.fat,
            protein: +form.protein,
            carbs: +form.carbs,
            category_id: +form.category_id
        };
        try {
            if (product) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/products/${product.id}`,
                    payload
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/products`,
                    payload
                );
            }
            onSuccess();
            onClose();
        } catch (e) {
            setErr(e.response?.data?.error || 'Server error');
        }
    };

    /* ----- render ----- */
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-full max-w-md space-y-3">
                <h2 className="text-xl font-semibold">
                    {product ? 'Edit product' : 'Add product'}
                </h2>

                {['name', 'calories', 'fat', 'protein', 'carbs'].map(key => (
                    <input
                        key={key}
                        name={key}
                        placeholder={key}
                        value={form[key]}
                        onChange={handle}
                        className="border p-2 w-full rounded"
                    />
                ))}

                {/* ---- category select ---- */}
                <select
                    name="category_id"
                    value={form.category_id ?? ''}
                    onChange={handle}
                    className="border p-2 w-full rounded"
                >
                    {cats.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.label}
                        </option>
                    ))}
                </select>

                {err && <p className="text-red-600">{err}</p>}

                <div className="flex gap-2 justify-end">
                    <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={submit}>
                        {product ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

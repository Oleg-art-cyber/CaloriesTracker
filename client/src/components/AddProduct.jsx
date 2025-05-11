// client/src/components/AddProduct.jsx
import { useState } from 'react';
import axios from 'axios';

export default function AddProduct({ onSuccess, onClose }) {
    const [form, setForm] = useState({
        name: '', calories: '', fat: '', protein: '', carbs: '', category: ''
    });
    const [err, setErr]   = useState(null);

    const handleChange = e =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/products`, {
                ...form,
                calories: +form.calories,
                fat: +form.fat,
                protein: +form.protein,
                carbs: +form.carbs,
            });
            onSuccess();
            onClose();
        } catch (e) {
            setErr(e.response?.data?.error || 'Server error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-full max-w-md space-y-3">
                <h2 className="text-xl font-semibold">Add product</h2>

                {['name','calories','fat','protein','carbs','category'].map(key => (
                    <input
                        key={key}
                        name={key}
                        placeholder={key}
                        value={form[key]}
                        onChange={handleChange}
                        className="border p-2 w-full rounded"
                    />
                ))}

                {err && <p className="text-red-600">{err}</p>}

                <div className="flex gap-2 justify-end">
                    <button
                        className="px-4 py-2 rounded bg-gray-200"
                        onClick={onClose}>Cancel</button>
                    <button
                        className="px-4 py-2 rounded bg-blue-600 text-white"
                        onClick={submit}>Save</button>
                </div>
            </div>
        </div>
    );
}

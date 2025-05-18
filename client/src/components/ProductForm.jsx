// client/src/components/ProductForm.jsx
import { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'

export default function ProductForm({ product, onSuccess, onClose }) {
    const { token } = useContext(AuthContext)
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

    const [cats, setCats] = useState([])
    const [form, setForm] = useState({
        name: '',
        calories: '',
        fat: '',
        protein: '',
        carbs: '',
        category_id: ''
    })
    const [err, setErr] = useState(null)

    // Load categories on mount
    useEffect(() => {
        axios
            .get('/api/categories', { headers: authHeader })
            .then(res => {
                setCats(res.data)
                const other = res.data.find(c => c.name === 'other')
                setForm(f => ({
                    ...f,
                    category_id: other?.id ?? res.data[0]?.id
                }))
            })
            .catch(e => {
                console.error(e)
                setErr('Failed to load categories')
            })
    }, [])

    // If editing, populate form
    useEffect(() => {
        if (product && cats.length) {
            setForm({
                name:        product.name,
                calories:    String(product.calories),
                fat:         String(product.fat),
                protein:     String(product.protein),
                carbs:       String(product.carbs),
                category_id: product.category_id
            })
        }
    }, [product, cats])

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({
            ...prev,
            [name]: name === 'category_id' ? Number(value) : value
        }))
        setErr(null)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const payload = {
            name:        form.name,
            calories:    Number(form.calories),
            fat:         Number(form.fat),
            protein:     Number(form.protein),
            carbs:       Number(form.carbs),
            category_id: form.category_id
        }
        try {
            if (product) {
                await axios.put(`/api/products/${product.id}`, payload, { headers: authHeader })
            } else {
                await axios.post('/api/products', payload, { headers: authHeader })
            }
            onSuccess()
            onClose()
        } catch (e) {
            console.error(e)
            setErr(e.response?.data?.error || 'Server error')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-2xl w-full max-w-md space-y-5"
            >
                <h2 className="text-xl font-semibold text-center">
                    {product ? 'Edit Product' : 'Add Product'}
                </h2>

                {['name', 'calories', 'fat', 'protein', 'carbs'].map(key => (
                    <input
                        key={key}
                        name={key}
                        placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                        value={form[key]}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                ))}

                <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    {cats.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.label}
                        </option>
                    ))}
                </select>

                {err && <p className="text-red-600 text-center">{err}</p>}

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        {product ? 'Update' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    )
}

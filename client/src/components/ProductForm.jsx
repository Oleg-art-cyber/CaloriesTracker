// client/src/components/ProductForm.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function ProductForm({ product, onSuccess, onClose, onProductCreated }) {
    const { token } = useContext(AuthContext); // Token from context to gate API calls

    const [cats, setCats] = useState([]);
    const [form, setForm] = useState({
        name: '',
        calories: '',
        fat: '',
        protein: '',
        carbs: '',
        category_id: '' // Initialized as empty
    });
    const [err, setErr] = useState(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    // Effect to load categories
    useEffect(() => {
        // console.log("ProductForm: Categories loading useEffect. Token:", !!token, "Product prop:", product);
        if (token) {
            setIsLoadingCategories(true);
            // Axios should use the default auth header set in AuthContext
            axios.get('/api/categories')
                .then(res => {
                    const loadedCats = Array.isArray(res.data) ? res.data : [];
                    setCats(loadedCats);
                    // console.log("ProductForm: Categories loaded, count:", loadedCats.length);
                    // If creating a new product and categories are loaded, set a default category
                    // This check ensures it only runs if `form.category_id` hasn't been set (e.g., by editing)
                    if (!product && loadedCats.length > 0) {
                        setForm(f => {
                            if (!f.category_id) { // Only set if not already set (e.g. by a quick user input before cats load)
                                const otherCategory = loadedCats.find(c => c.name === 'other');
                                return {
                                    ...f,
                                    category_id: otherCategory?.id || loadedCats[0]?.id || ''
                                };
                            }
                            return f;
                        });
                    }
                })
                .catch(e => {
                    console.error("ProductForm: Failed to load categories", e);
                    setErr(`Failed to load categories: ${e.code === 'ERR_NETWORK' ? 'Network Error - check proxy & server' : (e.response?.data?.error || e.message)}`);
                })
                .finally(() => {
                    setIsLoadingCategories(false);
                    // console.log("ProductForm: Categories loading finished.");
                });
        } else {
            // console.log("ProductForm: No token, skipping category load.");
            setCats([]); // Clear categories if no token
        }
    }, [token, product]); // `product` dependency helps re-evaluate default category for new/edit correctly

    // Effect to populate form when editing an existing product or reset for a new one
    useEffect(() => {
        // console.log("ProductForm: existingProduct useEffect. Product ID:", product?.id, "Cats loaded:", cats.length);
        if (product && product.id) { // Editing an existing product
            // Set form fields from product prop.
            // If categories are already loaded, set category_id, otherwise it will be set when cats load.
            setForm({
                name: product.name || '',
                calories: product.calories != null ? String(product.calories) : '',
                fat: product.fat != null ? String(product.fat) : '',
                protein: product.protein != null ? String(product.protein) : '',
                carbs: product.carbs != null ? String(product.carbs) : '',
                category_id: product.category_id || (cats.length > 0 ? (cats.find(c => c.name === 'other')?.id ?? cats[0]?.id ?? '') : '')
            });
        } else { // New product form
            // Reset form fields, set default category if categories are loaded
            const defaultCatId = cats.length > 0 ? (cats.find(c => c.name === 'other')?.id ?? cats[0]?.id ?? '') : '';
            setForm({
                name: '', calories: '', fat: '', protein: '', carbs: '',
                category_id: defaultCatId
            });
        }
    }, [product, cats]); // Re-run when 'product' prop changes or 'cats' are loaded

    // Handles changes in form input fields
    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'category_id' ? Number(value) : value
        }));
        setErr(null); // Clear any previous error on input change
    }

    // Handles form submission (create or update product)
    async function handleSubmit(e) {
        e.preventDefault();
        setErr(null);

        // Client-side validation
        if (!form.name.trim()) { setErr('Product name is required.'); return; }
        if (form.calories === '' || isNaN(parseFloat(form.calories)) || parseFloat(form.calories) < 0) {
            setErr('Valid, non-negative calories are required.'); return;
        }
        const numCalories = Number(form.calories);
        const numFat = form.fat !== '' && !isNaN(parseFloat(form.fat)) ? Number(form.fat) : 0;
        const numProtein = form.protein !== '' && !isNaN(parseFloat(form.protein)) ? Number(form.protein) : 0;
        const numCarbs = form.carbs !== '' && !isNaN(parseFloat(form.carbs)) ? Number(form.carbs) : 0;

        if (numFat < 0 || numProtein < 0 || numCarbs < 0) { // Check only if they are numbers
            setErr('Fat, protein, and carbs must be non-negative numbers if provided.'); return;
        }
        if (!form.category_id) { setErr('Please select a category.'); return; }

        const payload = {
            name: form.name.trim(), calories: numCalories, fat: numFat,
            protein: numProtein, carbs: numCarbs, category_id: Number(form.category_id)
        };

        try {
            let response;
            if (product && product.id) { // Editing existing product
                response = await axios.put(`/api/products/${product.id}`, payload); // Axios uses default headers
            } else { // Creating new product
                response = await axios.post('/api/products', payload); // Axios uses default headers
            }

            if (onSuccess) onSuccess(); // Standard success callback (e.g., for Products page refresh)

            // If onProductCreated callback is provided (e.g., from RecipeForm), call it
            if (onProductCreated && response.data) {
                onProductCreated(response.data);
            }
            onClose(); // Close this modal
        } catch (errorResponse) {
            console.error("ProductForm submission error:", errorResponse);
            setErr(errorResponse.response?.data?.error || 'Server error saving product.');
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-fadeIn"> {/* High z-index */}
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-xl w-full max-w-md space-y-5 shadow-lg"
            >
                <h2 className="text-xl font-semibold text-center text-gray-800">
                    {product ? 'Edit Product' : 'Create New Product'}
                </h2>

                <div>
                    <label htmlFor="productForm-name" className="block text-sm font-medium text-gray-700">Name*</label>
                    <input
                        id="productForm-name"
                        name="name"
                        type="text"
                        placeholder="Product Name"
                        value={form.name}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="productForm-calories" className="block text-sm font-medium text-gray-700">Calories (per 100g)*</label>
                    <input
                        id="productForm-calories"
                        name="calories"
                        type="number"
                        placeholder="e.g., 150"
                        value={form.calories}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        min="0"
                        step="any" // Allows decimal calories
                        required
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label htmlFor="productForm-protein" className="block text-sm font-medium text-gray-700">Protein (g)</label>
                        <input id="productForm-protein" name="protein" type="number" placeholder="0" value={form.protein} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" min="0" step="any"/>
                    </div>
                    <div>
                        <label htmlFor="productForm-fat" className="block text-sm font-medium text-gray-700">Fat (g)</label>
                        <input id="productForm-fat" name="fat" type="number" placeholder="0" value={form.fat} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" min="0" step="any"/>
                    </div>
                    <div>
                        <label htmlFor="productForm-carbs" className="block text-sm font-medium text-gray-700">Carbs (g)</label>
                        <input id="productForm-carbs" name="carbs" type="number" placeholder="0" value={form.carbs} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" min="0" step="any"/>
                    </div>
                </div>

                <div>
                    <label htmlFor="productForm-category_id" className="block text-sm font-medium text-gray-700">Category*</label>
                    <select
                        id="productForm-category_id"
                        name="category_id"
                        value={form.category_id}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        required
                        disabled={isLoadingCategories}
                    >
                        <option value="" disabled>{isLoadingCategories ? "Loading categories..." : "Select category..."}</option>
                        {cats.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>

                {err && <p className="text-red-600 text-center text-sm bg-red-50 p-2 rounded-md">{err}</p>}

                <div className="flex justify-end gap-3 pt-3 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        {product ? 'Update Product' : 'Save Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
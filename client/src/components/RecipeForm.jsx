// client/src/components/RecipeForm.jsx
import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ProductForm from './ProductForm';

// Subcomponent for searching products to add as ingredients
function IngredientProductSearch({ products, onSelectProduct, currentSearchTerm, onSearchTermChange }) {
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        // Filter products based on search term, show a limited number of results
        if (currentSearchTerm.trim().length > 1) {
            setSearchResults(
                products.filter(p => p.name && p.name.toLowerCase().includes(currentSearchTerm.toLowerCase())).slice(0, 7)
            );
        } else {
            setSearchResults([]);
        }
    }, [currentSearchTerm, products]);

    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Search product for ingredient..."
                value={currentSearchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="w-full border p-2 rounded mb-1 shadow-sm"
                name="ingredientSearch" // for accessibility and form tools
                aria-label="Search product for ingredient"
            />
            {searchResults.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto mt-1">
                    {searchResults.map(product => (
                        <li
                            key={product.id}
                            onClick={() => {
                                onSelectProduct(product); // Callback to parent with selected product
                            }}
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                            {product.name} ({product.calories} kcal/100g)
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function RecipeForm({ existingRecipe, onClose }) {
    const { token } = useContext(AuthContext);
    // Axios default headers are set by AuthContext, so explicit authHeader might be redundant for GETs
    // but can be useful if specific headers are needed for POST/PUT, or for clarity.
    const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

    // Recipe details state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [totalServings, setTotalServings] = useState(1);
    const [ingredients, setIngredients] = useState([]); // Stores ingredient objects for the current recipe

    // State for managing ingredient selection UI
    const [allProducts, setAllProducts] = useState([]); // Full list of available products
    const [productSearchTerm, setProductSearchTerm] = useState(''); // For filtering the product <select>
    const [filteredProductsForSelect, setFilteredProductsForSelect] = useState([]);
    const [selectedProductIdForIngredient, setSelectedProductIdForIngredient] = useState(''); // ID from <select>
    const [currentIngredientAmount, setCurrentIngredientAmount] = useState(100); // Amount for product to be added

    // Form UI state
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // For main recipe form submission
    const [productsLoading, setProductsLoading] = useState(false); // For initial product list load
    const [showQuickProductModal, setShowQuickProductModal] = useState(false); // To toggle ProductForm modal

    // Effect to load all available products for ingredient selection
    useEffect(() => {
        if (token) {
            setProductsLoading(true);
            axios.get('/api/products', { params: { limit: 200 }, headers: authHeader }) // Limit for performance
                .then(res => {
                    const data = res.data;
                    const productsArray = Array.isArray(data) ? data :
                        (data && Array.isArray(data.data)) ? data.data :
                            (data && Array.isArray(data.products)) ? data.products : [];
                    setAllProducts(productsArray);
                })
                .catch(e => {
                    console.error("RecipeForm: Failed to load products", e);
                    setError(`Could not load product list: ${e.code === 'ERR_NETWORK' ? 'Network Error - check proxy & server' : (e.response?.data?.error || e.message)}`);
                })
                .finally(() => setProductsLoading(false));
        } else {
            setAllProducts([]);
        }
    }, [token, authHeader]);

    // Effect to populate form fields when editing an existing recipe
    useEffect(() => {
        if (existingRecipe && existingRecipe.id) {
            setName(existingRecipe.name || '');
            setDescription(existingRecipe.description || '');
            setIsPublic(existingRecipe.is_public || false);
            setTotalServings(existingRecipe.total_servings || 1);

            const formattedIngredients = (existingRecipe.ingredients || []).map(ing => ({
                productId: ing.product_id, name: ing.product_name, amountGrams: ing.amount_grams,
                calories_per_100g: ing.product_calories_per_100g, protein_per_100g: ing.product_protein_per_100g,
                fat_per_100g: ing.product_fat_per_100g, carbs_per_100g: ing.product_carbs_per_100g,
            }));
            setIngredients(formattedIngredients);
        } else {
            // Reset form for a new recipe
            setName(''); setDescription(''); setIsPublic(false); setTotalServings(1); setIngredients([]);
        }
    }, [existingRecipe]);

    // Effect to update the filtered list for the <select> dropdown when search term or allProducts change
    useEffect(() => {
        if (productSearchTerm.trim() === '') {
            setFilteredProductsForSelect(allProducts);
        } else {
            setFilteredProductsForSelect(
                allProducts.filter(p =>
                    p.name && typeof p.name === 'string' && p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
                )
            );
        }
    }, [productSearchTerm, allProducts]);

    // Adds the currently selected product (from <select>) and amount to the recipe's ingredient list
    const handleAddIngredientToList = () => {
        if (!selectedProductIdForIngredient) { setError('Please select a product from the list.'); return; }
        const productToAdd = allProducts.find(p => p.id === Number(selectedProductIdForIngredient));
        if (!productToAdd) { setError('Selected product not found.'); return; }

        const amount = parseFloat(currentIngredientAmount);
        if (isNaN(amount) || amount <= 0) { setError('Ingredient amount must be a positive number.'); return; }
        if (ingredients.find(ing => ing.productId === productToAdd.id)) { setError(`"${productToAdd.name}" is already an ingredient.`); return; }

        setIngredients(prev => [...prev, {
            productId: productToAdd.id, name: productToAdd.name, amountGrams: amount,
            calories_per_100g: productToAdd.calories, protein_per_100g: productToAdd.protein,
            fat_per_100g: productToAdd.fat, carbs_per_100g: productToAdd.carbs,
        }]);
        setSelectedProductIdForIngredient('');
        setCurrentIngredientAmount(100);
        setError('');
    };

    // Updates the amount of an ingredient already in the list
    const handleIngredientAmountChange = (productId, newAmountStr) => {
        const newAmount = parseFloat(newAmountStr);
        setIngredients(prev => prev.map(ing =>
            ing.productId === productId ? { ...ing, amountGrams: isNaN(newAmount) || newAmount < 0 ? 0 : newAmount } : ing
        ));
    };

    // Removes an ingredient from the recipe list
    const handleRemoveIngredient = (productId) => {
        setIngredients(prev => prev.filter(ing => ing.productId !== productId));
    };

    // Memoized calculation of total nutrition for the entire recipe
    const recipeTotals = useMemo(() => ingredients.reduce((acc, ing) => {
        const ratio = (parseFloat(ing.amountGrams) || 0) / 100.0;
        acc.kcal += (parseFloat(ing.calories_per_100g) || 0) * ratio;
        acc.protein += (parseFloat(ing.protein_per_100g) || 0) * ratio;
        acc.fat += (parseFloat(ing.fat_per_100g) || 0) * ratio;
        acc.carbs += (parseFloat(ing.carbs_per_100g) || 0) * ratio;
        return acc;
    }, { kcal: 0, protein: 0, fat: 0, carbs: 0 }), [ingredients]);

    // Memoized calculation of nutrition per serving
    const servingTotals = useMemo(() => {
        const servingsNum = parseFloat(totalServings) || 1; // Default to 1 to avoid division by zero
        return {
            kcal: servingsNum > 0 ? recipeTotals.kcal / servingsNum : 0,
            protein: servingsNum > 0 ? recipeTotals.protein / servingsNum : 0,
            fat: servingsNum > 0 ? recipeTotals.fat / servingsNum : 0,
            carbs: servingsNum > 0 ? recipeTotals.carbs / servingsNum : 0,
        };
    }, [recipeTotals, totalServings]);

    // Handles submission of the recipe form (create or update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMessage('');
        if (!name.trim()) { setError('Recipe name is required.'); return; }
        if (ingredients.length === 0) { setError('Recipe must have at least one ingredient.'); return; }
        const numTotalServings = parseFloat(totalServings);
        if (isNaN(numTotalServings) || numTotalServings <= 0) { setError('Total servings must be a positive number.'); return; }

        setIsSubmitting(true);
        const payload = {
            name: name.trim(), description: description.trim() || null, is_public: isPublic,
            total_servings: numTotalServings,
            ingredients: ingredients.map(ing => ({ productId: ing.productId, amountGrams: parseFloat(ing.amountGrams) })),
        };

        try {
            if (existingRecipe && existingRecipe.id) {
                await axios.put(`/api/recipes/${existingRecipe.id}`, payload, { headers: authHeader });
            } else {
                await axios.post('/api/recipes', payload, { headers: authHeader });
            }
            setSuccessMessage(existingRecipe ? 'Recipe updated successfully!' : 'Recipe created successfully!');
            setTimeout(() => { onClose(); }, 1500);
        } catch (err) {
            console.error("RecipeForm submission error:", err);
            setError(err.response?.data?.error || 'Failed to save recipe. Please check server logs.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Callback for when a new product is created via the nested ProductForm modal
    const handleNewProductCreated = (newProduct) => {
        if (newProduct && newProduct.id) {
            setAllProducts(prev => {
                // Add if not already present
                return prev.find(p => p.id === newProduct.id) ? prev : [...prev, newProduct];
            });
            // Pre-select the newly created product
            setSelectedProductIdForIngredient(String(newProduct.id));
            setCurrentIngredientAmount(100);
            setProductSearchTerm(newProduct.name); // Optionally update search term to show it
            setShowQuickProductModal(false); // Close the ProductForm modal
            setError('');
            setSuccessMessage(`Product "${newProduct.name}" created. You can now add it as an ingredient.`);
        } else {
            setShowQuickProductModal(false); // Ensure modal closes even if no product data
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            {/* Modal Container with flex-col to manage header, content, footer */}
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Modal Header (Sticky) */}
                <h2 className="text-2xl font-semibold text-center text-gray-700 py-4 px-6 border-b flex-shrink-0">
                    {existingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
                </h2>

                {/* Scrollable Form Content Area */}
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                    {/* Recipe Details Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="recipeFormNameUnique" className="block text-sm font-medium text-gray-700">Name*</label>
                            <input id="recipeFormNameUnique" name="recipeName" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full border p-2 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label htmlFor="recipeFormTotalServingsUnique" className="block text-sm font-medium text-gray-700">Total Servings*</label>
                            <input id="recipeFormTotalServingsUnique" name="totalServings" type="number" value={totalServings} onChange={e => setTotalServings(Math.max(0.1, parseFloat(e.target.value) || 1))} min="0.1" step="0.1" className="mt-1 w-full border p-2 rounded-md shadow-sm" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="recipeFormDescriptionUnique" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea id="recipeFormDescriptionUnique" name="recipeDescription" value={description} onChange={e => setDescription(e.target.value)} rows="2" className="mt-1 w-full border p-2 rounded-md shadow-sm"></textarea>
                    </div>
                    <div className="flex items-center">
                        <input id="recipeFormIsPublicUnique" name="isPublicRecipe" type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="recipeFormIsPublicUnique" className="ml-2 block text-sm text-gray-900">Make this recipe public</label>
                    </div>

                    {/* Manage Ingredients Section */}
                    <div className="pt-4 border-t mt-4">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Manage Ingredients</h3>
                        {productsLoading && <p className="text-sm text-gray-500">Loading products...</p>}

                        <div className="mb-2">
                            <label htmlFor="productSearchInputForRecipe" className="block text-sm font-medium text-gray-700">Filter Product List</label>
                            <input
                                id="productSearchInputForRecipe"
                                name="productSearchInputForRecipe"
                                type="text"
                                placeholder="Type to filter..."
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                className="mt-1 w-full border p-2 rounded-md shadow-sm"
                                disabled={productsLoading}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 items-end mb-2">
                            <div className="flex-grow md:col-span-1">
                                <label htmlFor="productSelectForIngredientRecipe" className="block text-sm font-medium text-gray-700">Select Product</label>
                                <select
                                    id="productSelectForIngredientRecipe"
                                    name="productSelectForIngredient"
                                    className="mt-1 w-full border p-2 rounded-md shadow-sm h-[114px] bg-white"
                                    size={5}
                                    value={selectedProductIdForIngredient}
                                    onChange={e => {setSelectedProductIdForIngredient(e.target.value); setError('');}}
                                    disabled={productsLoading || filteredProductsForSelect.length === 0}
                                >
                                    {filteredProductsForSelect.length === 0 && !productsLoading && <option value="" disabled>(No products match)</option>}
                                    {filteredProductsForSelect.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.calories} kcal/100g)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <label htmlFor="currentIngredientAmountForRecipe" className="block text-sm font-medium text-gray-700">Amount (g)</label>
                                <input
                                    id="currentIngredientAmountForRecipe"
                                    name="currentIngredientAmount"
                                    type="number"
                                    value={currentIngredientAmount}
                                    onChange={e => setCurrentIngredientAmount(e.target.value)}
                                    className="mt-1 w-full border p-2 rounded-md shadow-sm"
                                    min="1"
                                    disabled={!selectedProductIdForIngredient}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddIngredientToList}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md shadow-sm self-end h-[42px]"
                                disabled={!selectedProductIdForIngredient || isSubmitting || productsLoading}
                            >
                                Add Ingredient
                            </button>
                        </div>
                        <div className="mt-2 text-xs text-right">
                            <button
                                type="button"
                                onClick={() => setShowQuickProductModal(true)}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Can't find product? Create New
                            </button>
                        </div>
                    </div>

                    {/* Current Ingredients List */}
                    {ingredients.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 mt-4">
                            <h4 className="font-medium text-gray-700 mb-2">Current Recipe Ingredients:</h4>
                            {ingredients.map(ing => (
                                <div key={ing.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100">
                                    <span className="text-sm flex-grow mr-2 truncate" title={ing.name}>{ing.name}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <input
                                            name={`ingredient_amount_${ing.productId}`} // Unique name for form purposes
                                            type="number"
                                            value={ing.amountGrams}
                                            onChange={e => handleIngredientAmountChange(ing.productId, e.target.value)}
                                            className="w-20 border p-1 text-sm text-center rounded-md shadow-sm"
                                            min="1"
                                        />
                                        <span className="text-xs text-gray-500">g</span>
                                        <button type="button" onClick={() => handleRemoveIngredient(ing.productId)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Calculated Totals Display */}
                    {ingredients.length > 0 && (
                        <div className="mt-4 p-3 border rounded-md bg-indigo-50 text-sm">
                            <h4 className="font-semibold text-indigo-700 mb-1">Totals (Entire Recipe / Per Serving):</h4>
                            <p>KCal: {recipeTotals.kcal.toFixed(0)} / {servingTotals.kcal.toFixed(0)}</p>
                            <p>Protein: {recipeTotals.protein.toFixed(1)}g / {servingTotals.protein.toFixed(1)}g</p>
                            <p>Fat: {recipeTotals.fat.toFixed(1)}g / {servingTotals.fat.toFixed(1)}g</p>
                            <p>Carbs: {recipeTotals.carbs.toFixed(1)}g / {servingTotals.carbs.toFixed(1)}g</p>
                        </div>
                    )}

                    {error && <p className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                    {successMessage && <p className="mt-2 text-sm text-green-600 bg-green-100 p-2 rounded-md">{successMessage}</p>}
                </form> {/* Form tag now wraps only the scrollable content */}

                {/* Modal Footer (Sticky) */}
                <div className="flex-shrink-0 px-6 py-4 border-t flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button" // Changed to "button" to prevent implicit form submission
                        onClick={handleSubmit} // Explicitly call handleSubmit
                        disabled={isSubmitting || productsLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : (existingRecipe ? 'Update Recipe' : 'Save Recipe')}
                    </button>
                </div>
            </div>

            {showQuickProductModal && (
                <ProductForm
                    onClose={() => setShowQuickProductModal(false)}
                    onProductCreated={handleNewProductCreated}
                />
            )}
        </div>
    );
}
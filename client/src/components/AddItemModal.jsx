// client/src/components/AddItemModal.jsx
import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function AddItemModal({ type, date, close }) { // Expects 'type' prop (e.g., "breakfast")
    const { token } = useContext(AuthContext);
    // Axios default headers set by AuthContext are used for requests.
    // Explicit authHeader can be used if needed for specific overrides, but often not necessary.
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};


    // Derive title from 'type' prop, with a fallback for safety.
    const mealTypeForTitle = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Current Meal';

    const [itemTypeToAdd, setItemTypeToAdd] = useState('product'); // Controls which UI section is visible: 'product' or 'recipe'

    // State for product selection
    const [allProducts, setAllProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState(''); // Stores the ID of the selected product
    const [productAmount, setProductAmount] = useState(100);    // Stores the amount for the selected product

    // State for recipe selection
    const [allRecipes, setAllRecipes] = useState([]);
    const [recipeSearch, setRecipeSearch] = useState('');
    const [selectedRecipeId, setSelectedRecipeId] = useState('');   // Stores the ID of the selected recipe
    const [recipeServings, setRecipeServings] = useState(1);      // Stores servings for the selected recipe

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // General loading state for API calls within this modal

    // Effect to load products if 'product' tab is active and list is empty
    useEffect(() => {
        if (!type) {
            console.error("AddItemModal: 'type' prop is undefined or missing. Cannot determine meal context for product loading.");
            setError("Internal error: Meal context is missing."); // Show error to user
            return;
        }
        if (itemTypeToAdd === 'product' && allProducts.length === 0 && token) {
            setIsLoading(true);
            axios.get('/api/products', { params: { limit: 10000 }, headers: authHeader }) // Consider pagination for large lists
                .then(r => {
                    const raw = r.data;
                    const arr = Array.isArray(raw) ? raw :
                        (raw && Array.isArray(raw.data)) ? raw.data :
                            (raw && Array.isArray(raw.products)) ? raw.products : [];
                    setAllProducts(arr);
                })
                .catch(e => {
                    console.error('AddItemModal: GET /api/products failed:', e);
                    setError('Could not load product list. ' + (e.response?.data?.error || e.message || ''));
                })
                .finally(() => setIsLoading(false));
        }
    }, [itemTypeToAdd, token, allProducts.length, type, authHeader]); // Added authHeader to deps if it's not stable via useMemo (though defaults preferred)

    // Effect to load recipes if 'recipe' tab is active and list is empty
    useEffect(() => {
        if (!type) {
            console.error("AddItemModal: 'type' prop is undefined or missing. Cannot determine meal context for recipe loading.");
            // Error state might already be set by the product loading useEffect if type is consistently missing
            return;
        }
        if (itemTypeToAdd === 'recipe' && allRecipes.length === 0 && token) {
            setIsLoading(true);
            axios.get('/api/recipes', { headers: authHeader }) // Assuming this fetches user's and public recipes
                .then(r => {
                    setAllRecipes(Array.isArray(r.data) ? r.data : []);
                })
                .catch(e => {
                    console.error('AddItemModal: GET /api/recipes failed:', e);
                    setError('Could not load recipe list. ' + (e.response?.data?.error || e.message || ''));
                })
                .finally(() => setIsLoading(false));
        }
    }, [itemTypeToAdd, token, allRecipes.length, type, authHeader]); // Added authHeader to deps

    // Filtered lists for display
    const filteredProducts = productSearch.trim() === '' ? allProducts : allProducts.filter(p => p.name && p.name.toLowerCase().includes(productSearch.toLowerCase()));
    const filteredRecipes = recipeSearch.trim() === '' ? allRecipes : allRecipes.filter(r => r.name && r.name.toLowerCase().includes(recipeSearch.toLowerCase()));

    // Effect to auto-select if only one recipe is available after filtering/loading
    useEffect(() => {
        if (itemTypeToAdd === 'recipe' && filteredRecipes.length === 1) {
            // If there's only one recipe and it's not already selected, select it.
            if (selectedRecipeId !== String(filteredRecipes[0].id)) {
                setSelectedRecipeId(String(filteredRecipes[0].id));
                setError(''); // Clear any "please select" error
            }
        }
        // If multiple or no recipes, user must manually select. `selectedRecipeId` remains as is or empty.
    }, [filteredRecipes, itemTypeToAdd, selectedRecipeId]);

    // Effect to reset selections when switching between Product/Recipe tabs
    useEffect(() => {
        setSelectedProductId('');
        setProductSearch('');
        setSelectedRecipeId('');
        setRecipeSearch('');
        setError(''); // Clear errors on tab switch
    }, [itemTypeToAdd]);

    // Handler to add the selected item (product or recipe) to the diary
    const handleAddItemToDiary = async () => {
        setError('');
        if (!type) { // Guard against undefined meal type
            setError("Cannot add item: Meal type context is missing.");
            console.error("AddItemModal: Attempted to add item with undefined 'type' prop.");
            return;
        }

        let payloadItem;
        if (itemTypeToAdd === 'product') {
            if (!selectedProductId) { setError('Please select a product.'); return; }
            const numProductAmount = parseFloat(productAmount);
            if (isNaN(numProductAmount) || numProductAmount <= 0) { setError('Product amount must be a positive number.'); return; }
            payloadItem = { productId: Number(selectedProductId), amountGrams: numProductAmount };
        } else if (itemTypeToAdd === 'recipe') {
            if (!selectedRecipeId) { setError('Please select a recipe.'); return; } // This check should now pass if one recipe was auto-selected
            const numRecipeServings = parseFloat(recipeServings);
            if (isNaN(numRecipeServings) || numRecipeServings <= 0) { setError('Recipe servings must be a positive number.'); return; }
            payloadItem = { recipeId: Number(selectedRecipeId), servingsConsumed: numRecipeServings };
        } else {
            setError('Invalid item type selected.'); // Should not be reached
            return;
        }

        setIsLoading(true); // Indicate submission in progress
        try {
            await axios.post(
                `/api/diary/${type}`, // Use the 'type' prop (e.g., "breakfast") for the API endpoint
                { date, items: [payloadItem] }, // Server expects 'items' to be an array
                { headers: authHeader }
            );
            close(); // Close modal and trigger reload in parent (Diary.jsx)
        } catch (e) {
            console.error(`AddItemModal: POST /api/diary/${type} failed:`, e);
            setError(e.response?.data?.error || `Server error adding item to ${mealTypeForTitle}.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white p-5 rounded-xl w-full max-w-md space-y-4 shadow-xl">
                <h3 className="text-xl font-semibold text-gray-700 text-center">
                    Add to {mealTypeForTitle}
                </h3>

                {/* Tabs for Product/Recipe selection */}
                <div className="flex border-b">
                    <button
                        onClick={() => { setItemTypeToAdd('product'); /* Reset handled by useEffect on itemTypeToAdd */ }}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${itemTypeToAdd === 'product' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Product
                    </button>
                    <button
                        onClick={() => { setItemTypeToAdd('recipe'); /* Reset handled by useEffect on itemTypeToAdd */ }}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${itemTypeToAdd === 'recipe' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Recipe
                    </button>
                </div>

                {isLoading && itemTypeToAdd === 'product' && allProducts.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Loading products...</p>}
                {isLoading && itemTypeToAdd === 'recipe' && allRecipes.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Loading recipes...</p>}

                {/* Product Input Section */}
                {itemTypeToAdd === 'product' && (
                    <div className="space-y-3">
                        <input name="productSearch" aria-label="Search products" type="text" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full border p-2 rounded-md shadow-sm"/>
                        <select
                            name="productList"
                            aria-label="Product list"
                            className="w-full border p-2 rounded-md shadow-sm bg-white" // Added bg-white for consistency
                            size="5"
                            value={selectedProductId}
                            onChange={e => { setSelectedProductId(e.target.value); setError(''); }}
                            disabled={isLoading || filteredProducts.length === 0}
                        >
                            {filteredProducts.length === 0 && !isLoading && <option value="" disabled>(No products match or loaded)</option>}
                            {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.calories} kcal/100g)</option>)}
                        </select>
                        <div>
                            <label htmlFor="productAmount" className="block text-sm font-medium text-gray-700">Amount (grams)</label>
                            <input id="productAmount" name="productAmount" type="number" min="1" className="w-full border p-2 rounded-md mt-1 shadow-sm" value={productAmount} onChange={e => setProductAmount(e.target.value)} />
                        </div>
                    </div>
                )}

                {/* Recipe Input Section */}
                {itemTypeToAdd === 'recipe' && (
                    <div className="space-y-3">
                        <input name="recipeSearch" aria-label="Search recipes" type="text" placeholder="Search recipes..." value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} className="w-full border p-2 rounded-md shadow-sm"/>
                        <select
                            name="recipeList"
                            aria-label="Recipe list"
                            className="w-full border p-2 rounded-md shadow-sm bg-white" // Added bg-white
                            size="5"
                            value={selectedRecipeId}
                            onChange={e => { setSelectedRecipeId(e.target.value); setError(''); }}
                            disabled={isLoading || filteredRecipes.length === 0}
                        >
                            {filteredRecipes.length === 0 && !isLoading && <option value="" disabled>(No recipes match or loaded)</option>}
                            {filteredRecipes.map(r => <option key={r.id} value={r.id}>{r.name} (Serves {r.total_servings})</option>)}
                        </select>
                        <div>
                            <label htmlFor="recipeServings" className="block text-sm font-medium text-gray-700">Servings Consumed</label>
                            <input id="recipeServings" name="recipeServings" type="number" min="0.1" step="0.1" className="w-full border p-2 rounded-md mt-1 shadow-sm" value={recipeServings} onChange={e => setRecipeServings(e.target.value)} />
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md mt-2">{error}</p>}

                <div className="flex justify-end gap-3 pt-3 border-t mt-4">
                    <button type="button" onClick={close} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                    <button
                        type="button"
                        onClick={handleAddItemToDiary}
                        disabled={isLoading || (!type)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                        {isLoading ? 'Adding...' : 'Add to Diary'}
                    </button>
                </div>
            </div>
        </div>
    );
}
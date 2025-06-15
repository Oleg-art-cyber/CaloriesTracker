// client/src/components/AddItemModal.jsx
import { useEffect, useState, useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function AddItemModal({ type, date, close }) {
    const { token } = useContext(AuthContext);
    const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

    const mealTypeForTitle = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Current Meal';

    const [itemTypeToAdd, setItemTypeToAdd] = useState('product');

    // Product state
    const [allProducts, setAllProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [productAmount, setProductAmount] = useState(100);

    // Recipe state
    const [allRecipes, setAllRecipes] = useState([]);
    const [recipeSearch, setRecipeSearch] = useState('');
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [recipeServings, setRecipeServings] = useState(1);

    // Control state
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Effect to fetch products
    useEffect(() => {
        if (itemTypeToAdd === 'product' && token) {
            setIsLoading(true);
            axios.get('/api/products', { params: { limit: 10000 }, headers: authHeader })
                .then(r => {
                    // --- FIX IS HERE ---
                    // The product data is inside the 'data' property of the response object.
                    const productsArray = Array.isArray(r.data?.data) ? r.data.data : [];

                    setAllProducts(productsArray);
                })
                .catch(e => {
                    console.error('AddItemModal: GET /api/products failed:', e);
                    setError('Could not load product list.');
                })
                .finally(() => setIsLoading(false));
        }
    }, [itemTypeToAdd, token, authHeader]);

    // Effect for recipes
    useEffect(() => {
        if (itemTypeToAdd === 'recipe' && token) {
            setIsLoading(true);
            axios.get('/api/recipes', { headers: authHeader })
                .then(r => {
                    setAllRecipes(Array.isArray(r.data) ? r.data : []);
                })
                .catch(e => {
                    console.error('AddItemModal: GET /api/recipes failed:', e);
                    setError('Could not load recipe list.');
                })
                .finally(() => setIsLoading(false));
        }
    }, [itemTypeToAdd, token, authHeader]);

    const filteredProducts = useMemo(() =>
            productSearch.trim() === ''
                ? allProducts
                : allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())),
        [allProducts, productSearch]
    );

    const filteredRecipes = useMemo(() =>
            recipeSearch.trim() === ''
                ? allRecipes
                : allRecipes.filter(r => r.name.toLowerCase().includes(recipeSearch.toLowerCase())),
        [allRecipes, recipeSearch]
    );

    // Effect to auto-select the first item in the list
    useEffect(() => {
        if (itemTypeToAdd === 'product' && filteredProducts.length > 0) {
            setSelectedProductId(filteredProducts[0].id.toString());
        } else {
            setSelectedProductId('');
        }
    }, [filteredProducts, itemTypeToAdd]);

    useEffect(() => {
        if (itemTypeToAdd === 'recipe' && filteredRecipes.length > 0) {
            setSelectedRecipeId(filteredRecipes[0].id.toString());
        } else {
            setSelectedRecipeId('');
        }
    }, [filteredRecipes, itemTypeToAdd]);

    const handleTabSwitch = (tab) => {
        setItemTypeToAdd(tab);
        setError('');
        setProductSearch('');
        setRecipeSearch('');
    };

    const handleAddItemToDiary = async () => {
        setError('');
        if (!type) {
            setError("Cannot add item: Meal type context is missing.");
            return;
        }
        let payloadItem;
        if (itemTypeToAdd === 'product') {
            if (!selectedProductId) { setError('Please select a product.'); return; }
            const numProductAmount = parseFloat(productAmount);
            if (isNaN(numProductAmount) || numProductAmount <= 0) { setError('Product amount must be a positive number.'); return; }
            payloadItem = { productId: Number(selectedProductId), amountGrams: numProductAmount };
        } else if (itemTypeToAdd === 'recipe') {
            if (!selectedRecipeId) { setError('Please select a recipe.'); return; }
            const numRecipeServings = parseFloat(recipeServings);
            if (isNaN(numRecipeServings) || numRecipeServings <= 0) { setError('Recipe servings must be a positive number.'); return; }
            payloadItem = { recipeId: Number(selectedRecipeId), servingsConsumed: numRecipeServings };
        } else {
            setError('Invalid item type selected.');
            return;
        }
        setIsLoading(true);
        try {
            await axios.post(
                `/api/diary/${type}`,
                { date, items: [payloadItem] },
                { headers: authHeader }
            );
            if (close) close();
        } catch (e) {
            console.error(`AddItemModal: POST /api/diary/${type} failed:`, e);
            setError(e.response?.data?.error || `Server error adding item to ${mealTypeForTitle}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const isSubmitDisabled = isLoading || !type || (itemTypeToAdd === 'product' && !selectedProductId) || (itemTypeToAdd === 'recipe' && !selectedRecipeId);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white p-5 rounded-xl w-full max-w-md space-y-4 shadow-xl">
                <h3 className="text-xl font-semibold text-gray-700 text-center">Add to {mealTypeForTitle}</h3>

                <div className="flex border-b">
                    <button onClick={() => handleTabSwitch('product')} className={`flex-1 py-2 text-sm font-medium transition-colors ${itemTypeToAdd === 'product' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        Product
                    </button>
                    <button onClick={() => handleTabSwitch('recipe')} className={`flex-1 py-2 text-sm font-medium transition-colors ${itemTypeToAdd === 'recipe' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        Recipe
                    </button>
                </div>

                {isLoading && <p className="text-sm text-gray-500 text-center py-4">Loading data...</p>}

                {itemTypeToAdd === 'product' && !isLoading && (
                    <div className="space-y-3">
                        <input name="productSearchModal" type="text" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full border p-2 rounded-md shadow-sm"/>
                        <select name="productListModal" className="w-full border p-2 rounded-md shadow-sm" size="5" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                            {filteredProducts.length === 0 && <option disabled>(No products match or found)</option>}
                            {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.calories} kcal/100g)</option>)}
                        </select>
                        <div>
                            <label htmlFor="productAmountModal" className="block text-sm font-medium text-gray-700">Amount (grams)</label>
                            <input id="productAmountModal" name="productAmountModal" type="number" min="1" className="w-full border p-2 rounded-md mt-1 shadow-sm" value={productAmount} onChange={e => setProductAmount(e.target.value)} />
                        </div>
                    </div>
                )}

                {itemTypeToAdd === 'recipe' && !isLoading && (
                    <div className="space-y-3">
                        <input name="recipeSearchModal" type="text" placeholder="Search recipes..." value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} className="w-full border p-2 rounded-md shadow-sm"/>
                        <select name="recipeListModal" className="w-full border p-2 rounded-md shadow-sm" size="5" value={selectedRecipeId} onChange={e => setSelectedRecipeId(e.target.value)}>
                            {filteredRecipes.length === 0 && <option disabled>(No recipes match or found)</option>}
                            {filteredRecipes.map(r => <option key={r.id} value={r.id}>{r.name} (Serves {r.total_servings})</option>)}
                        </select>
                        <div>
                            <label htmlFor="recipeServingsModal" className="block text-sm font-medium text-gray-700">Servings Consumed</label>
                            <input id="recipeServingsModal" name="recipeServingsModal" type="number" min="0.1" step="0.1" className="w-full border p-2 rounded-md mt-1 shadow-sm" value={recipeServings} onChange={e => setRecipeServings(e.target.value)} />
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md mt-2">{error}</p>}

                <div className="flex justify-end gap-3 pt-3 border-t mt-4">
                    <button type="button" onClick={close} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                    <button type="button" onClick={handleAddItemToDiary} disabled={isSubmitDisabled} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50">
                        {isLoading ? 'Adding...' : 'Add to Diary'}
                    </button>
                </div>
            </div>
        </div>
    );
}
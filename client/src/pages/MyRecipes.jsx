// client/src/pages/MyRecipes.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RecipeForm from '../components/RecipeForm.jsx';

/**
 * MyRecipes component for managing user recipes
 * Allows users to view, add, edit, and delete recipes
 */
export default function MyRecipes() {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const payload = token ? JSON.parse(atob(token.split('.')[1])) : {};
    const isAdmin = payload.role === 'admin';
    const userId = payload.id;

    const [recipes, setRecipes] = useState([]);
    const [error, setError] = useState(null);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingDetailsForId, setIsLoadingDetailsForId] = useState(null); // Store ID of recipe being loaded

    const [showForm, setShowForm] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState(null); // Stores full recipe object for the form

    /**
     * Fetches the list of recipes from the server
     */
    const fetchRecipes = async () => {
        if (!token) { setRecipes([]); return; }
        setIsLoadingList(true);
        setError(null);
        try {
            const { data } = await axios.get('/api/recipes', { headers: authHeader });
            setRecipes(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('MyRecipes: Failed to fetch recipes list:', e);
            setError(e.response?.data?.error || 'Server error fetching recipes list.');
            setRecipes([]);
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, [token]);

    /**
     * Handles the deletion of a recipe
     * @param {number} recipeId - ID of the recipe to delete
     */
    const handleDelete = async (recipeId) => {
        if (!confirm('Are you sure you want to delete this recipe? This cannot be undone.')) return;
        try {
            await axios.delete(`/api/recipes/${recipeId}`, { headers: authHeader });
            fetchRecipes();
        } catch (e) {
            console.error('MyRecipes: Failed to delete recipe:', e);
            alert(e.response?.data?.error || 'Could not delete recipe.');
        }
    };

    /**
     * Handles viewing or editing a recipe
     * @param {Object} recipeSummary - Summary of the recipe to view or edit
     */
    const handleViewOrEdit = async (recipeSummary) => {
        if (isLoadingDetailsForId === recipeSummary.id) return; // Prevent re-fetching if already loading this one

        setIsLoadingDetailsForId(recipeSummary.id); // Indicate which recipe is loading
        setError(null);
        try {
            const { data: fullRecipe } = await axios.get(`/api/recipes/${recipeSummary.id}`, { headers: authHeader });
            setEditingRecipe(fullRecipe);
            setShowForm(true);
        } catch (e) {
            console.error('MyRecipes: Failed to fetch full recipe details:', e);
            setError(e.response?.data?.error || 'Could not load recipe details.');
        } finally {
            setIsLoadingDetailsForId(null); // Clear loading indicator for this specific recipe
        }
    };

    /**
     * Handles adding a new recipe
     */
    const handleAdd = () => {
        setEditingRecipe(null);
        setShowForm(true);
    };

    /**
     * Handles closing the recipe form and refreshes the recipe list
     */
    const handleFormClose = () => {
        setShowForm(false);
        setEditingRecipe(null);
        fetchRecipes();
    };

    if (isLoadingList && recipes.length === 0) {
        return <p className="text-center text-gray-500 py-10">Loading recipes...</p>;
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Recipes</h1>
                <button
                    onClick={handleAdd}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition duration-150 ease-in-out"
                >
                    + Create Recipe
                </button>
            </div>

            {error && <p className="text-red-600 text-center bg-red-100 p-3 rounded-md">{error}</p>}

            {!isLoadingList && recipes.length === 0 && !error && !showForm && (
                <p className="text-gray-500 text-center py-10">
                    You haven't created any recipes yet. Click "Create Recipe" to get started!
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map(recipe => {
                    const canModify = isAdmin || recipe.user_id === userId;
                    const isLoadingThisRecipe = isLoadingDetailsForId === recipe.id;

                    return (
                        <div key={recipe.id} className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-xl">
                            <div className="p-5">
                                <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate" title={recipe.name}>{recipe.name}</h2>
                                <p className="text-sm text-gray-600 mb-1 h-10 overflow-y-hidden text-ellipsis">
                                    {recipe.description || <em>No description available.</em>}
                                </p>
                                <p className="text-xs text-gray-500 mb-3">
                                    Servings: {recipe.total_servings} | By: {recipe.created_by_username || 'Unknown'}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${recipe.is_public ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {recipe.is_public ? 'Public' : 'Private'}
                                    </span>
                                </p>
                                {/* No "View Details / Edit" button here anymore */}
                            </div>
                            {/* Action Buttons - only for owner or admin */}
                            {canModify && (
                                <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end space-x-2">
                                    <button
                                        onClick={() => handleViewOrEdit(recipe)} // This button now handles view/edit
                                        disabled={isLoadingThisRecipe}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1 px-3 rounded-md hover:bg-indigo-50 transition disabled:opacity-50"
                                    >
                                        {isLoadingThisRecipe ? 'Loading...' : 'View / Edit'} {/* Changed text */}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(recipe.id)}
                                        className="text-sm text-red-600 hover:text-red-800 font-medium py-1 px-3 rounded-md hover:bg-red-50 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showForm && (
                <RecipeForm
                    existingRecipe={editingRecipe}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
}
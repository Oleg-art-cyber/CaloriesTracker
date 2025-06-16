// client/src/components/MealItemRow.jsx
import axios from 'axios';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * MealItemRow component displays and manages a single meal item in the diary
 * @param {Object} item - The meal item data (product or recipe)
 * @param {Function} reload - Callback function to reload the diary data
 */
export default function MealItemRow({ item, reload }) {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const [editableAmount, setEditableAmount] = useState('');

    // Initialize editable amount based on item type
    useEffect(() => {
        if (item.type === 'product') {
            setEditableAmount(String(item.amount_grams || ''));
        } else if (item.type === 'recipe') {
            setEditableAmount(String(item.servings_consumed || ''));
        }
    }, [item]);

    /**
     * Handles changes to the amount input field
     * @param {Event} e - The change event
     */
    const handleAmountChange = (e) => {
        setEditableAmount(e.target.value);
    };

    /**
     * Saves the updated amount to the server
     * Validates input and handles errors
     */
    const handleSaveAmount = async () => {
        // Prevent saving if the value hasn't actually changed or is empty
        const originalValueStr = String(item.type === 'product' ? item.amount_grams : item.servings_consumed);
        if (editableAmount.trim() === '' || editableAmount === originalValueStr) {
            // If empty, revert to original to avoid saving an empty string
            if (editableAmount.trim() === '') setEditableAmount(originalValueStr);
            return;
        }

        const numValue = parseFloat(editableAmount);
        if (isNaN(numValue) || numValue <= 0) {
            alert("Amount/Servings must be a positive number.");
            setEditableAmount(originalValueStr); // Revert to original value
            return;
        }

        let payload;
        if (item.type === 'product') {
            // Ensure we don't send PATCH if value hasn't effectively changed
            if (numValue === parseFloat(item.amount_grams)) return;
            payload = { amountGrams: numValue };
        } else if (item.type === 'recipe') {
            if (numValue === parseFloat(item.servings_consumed)) return;
            payload = { servingsConsumed: numValue };
        } else {
            console.error("MealItemRow: Unknown item type:", item.type);
            return;
        }

        try {
            await axios.patch(
                `/api/diary/item/${item.meal_product_id}`,
                payload,
                { headers: authHeader }
            );
            reload();
        } catch (e) {
            console.error("MealItemRow: Failed to update meal item:", e);
            alert(e.response?.data?.error || "Failed to update item.");
            setEditableAmount(originalValueStr); // Revert on error
        }
    };

    /**
     * Removes the meal item from the diary
     * Confirms with user before deletion
     */
    const handleRemoveItem = async () => {
        if (!confirm(`Are you sure you want to remove "${item.name}" from this meal?`)) return;
        try {
            await axios.delete(
                `/api/diary/item/${item.meal_product_id}`,
                { headers: authHeader }
            );
            reload();
        } catch (e) {
            console.error("MealItemRow: Failed to remove meal item:", e);
            alert(e.response?.data?.error || "Failed to remove item.");
        }
    };

    // Determine unit for display based on item type
    const unitDisplay = item.type === 'product' ? 'g' : 's';

    return (
        <tr className="text-sm hover:bg-gray-50 transition-colors">
            <td className="px-3 py-2 text-left text-gray-700">{item.name}</td>
            <td className="px-3 py-2 text-center text-gray-600">{item.protein?.toFixed(1)}</td>
            <td className="px-3 py-2 text-center text-gray-600">{item.fat?.toFixed(1)}</td>
            <td className="px-3 py-2 text-center text-gray-600">{item.carbs?.toFixed(1)}</td>
            <td className="px-3 py-2 text-center text-gray-800 font-medium">{Math.round(item.kcal || 0)}</td>
            <td className="px-3 py-2 text-center">
                <input
                    type="number"
                    aria-label={`Amount for ${item.name}`}
                    value={editableAmount}
                    onChange={handleAmountChange}
                    onBlur={handleSaveAmount}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveAmount(); (e.target).blur(); }}}
                    className="w-20 border border-gray-300 p-1 text-center rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    min={item.type === 'product' ? "1" : "0.1"} // Min value based on type
                    step={item.type === 'product' ? "1" : "0.1"} // Step based on type
                />
                <span className="ml-1 text-xs text-gray-500">{unitDisplay}</span>
            </td>
            <td className="px-3 py-2 text-center">
                <button
                    onClick={handleRemoveItem}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    aria-label={`Remove ${item.name}`}
                >
                    ✕
                </button>
            </td>
        </tr>
    );
}
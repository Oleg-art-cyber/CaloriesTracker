// client/src/components/MealCard.jsx
import React, { useState } from 'react';
import MealItemRow from './MealItemRow.jsx';
import AddItemModal from './AddItemModal.jsx';

const MealCard = React.memo(function MealCard({ type, items, date, reload }) {
    const titleMap = {
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        dinner: 'Dinner',
        snack: 'Snack'
    };
    const title = titleMap[type] || 'Meal';

    const [addItemModalOpen, setAddItemModalOpen] = useState(false);

    const currentItems = Array.isArray(items) ? items : [];

    const totalKcal   = currentItems.reduce((sum, item) => sum + (parseFloat(item.kcal) || 0), 0);
    const totalProtein = currentItems.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
    const totalFat     = currentItems.reduce((sum, item) => sum + (parseFloat(item.fat) || 0), 0);
    const totalCarbs   = currentItems.reduce((sum, item) => sum + (parseFloat(item.carbs) || 0), 0);

    return (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm bg-white">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
                <button
                    onClick={() => setAddItemModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm transition"
                >
                    + Add Food
                </button>
            </div>

            {currentItems.length > 0 ? (
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-3 py-2 text-left font-medium">Item</th>
                        <th className="px-3 py-2 text-center font-medium">Protein (g)</th>
                        <th className="px-3 py-2 text-center font-medium">Fat (g)</th>
                        <th className="px-3 py-2 text-center font-medium">Carbs (g)</th>
                        <th className="px-3 py-2 text-center font-medium">KCal</th>
                        <th className="px-3 py-2 text-center font-medium">Amount</th>
                        <th className="px-3 py-2 text-center font-medium">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {currentItems.map((item) => (
                        <MealItemRow
                            key={item.meal_product_id}
                            item={item}
                            reload={reload}
                        />
                    ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                    <tr className="border-t-2 border-gray-300 font-semibold text-gray-700">
                        <td className="px-3 py-2 text-left">Totals</td>
                        <td className="px-3 py-2 text-center">{totalProtein.toFixed(1)}</td>
                        <td className="px-3 py-2 text-center">{totalFat.toFixed(1)}</td>
                        <td className="px-3 py-2 text-center">{totalCarbs.toFixed(1)}</td>
                        <td className="px-3 py-2 text-center">{Math.round(totalKcal)}</td>
                        <td className="px-3 py-2 text-center">{/* Placeholder */}</td>
                        <td className="px-3 py-2 text-center">{/* Placeholder */}</td>
                    </tr>
                    </tfoot>
                </table>
            ) : (
                <p className="text-sm text-gray-500 py-3 text-center">No items added to this meal yet.</p>
            )}

            {addItemModalOpen && (
                <AddItemModal
                    type={type}
                    date={date}
                    close={() => {
                        setAddItemModalOpen(false);
                        if (reload) reload();
                    }}
                />
            )}
        </div>
    );
});

export default MealCard;
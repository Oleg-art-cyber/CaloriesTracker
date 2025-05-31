// client/src/components/SummaryBox.jsx
export default function SummaryBox({ summary }) {
    // Use specific field names from backend's summary object
    const kcalConsumed = summary.kcal_consumed || 0;
    const protein = summary.protein || 0;
    const fat = summary.fat || 0;
    const carbs = summary.carbs || 0;
    const kcalBurnedExercise = summary.kcal_burned_exercise || 0;

    // Calculate Net Calories if both consumed and burned are available
    // The backend might already provide net_kcal
    const netKcal = summary.net_kcal !== undefined ? summary.net_kcal : kcalConsumed - kcalBurnedExercise;

    return (
        <div className="border border-gray-200 rounded-xl p-4 space-y-2 bg-gray-50 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Daily Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><span className="font-medium text-gray-600">Calories Consumed:</span> {Math.round(kcalConsumed)} kcal</p>
                <p><span className="font-medium text-gray-600">Protein:</span> {protein.toFixed(1)} g</p>
                <p><span className="font-medium text-gray-600">Calories Burned (Exercise):</span> {Math.round(kcalBurnedExercise)} kcal</p>
                <p><span className="font-medium text-gray-600">Fat:</span> {fat.toFixed(1)} g</p>
                <p className="font-semibold text-blue-600"><span className="font-medium">Net Calories:</span> {Math.round(netKcal)} kcal</p>
                <p><span className="font-medium text-gray-600">Carbs:</span> {carbs.toFixed(1)} g</p>
            </div>
        </div>
    );
}
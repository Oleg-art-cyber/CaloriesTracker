// client/src/components/SummaryBox.jsx
// Box showing daily totals
export default function SummaryBox({ summary }) {
    const { kcal, protein, fat, carbs } = summary;
    return (
        <div className="border rounded-xl p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Daily total</h3>
            <p className="text-sm">Calories: {kcal} kcal</p>
            <p className="text-sm">
                Protein: {protein} g &nbsp; Fat: {fat} g &nbsp; Carbs: {carbs} g
            </p>
        </div>
    );
}

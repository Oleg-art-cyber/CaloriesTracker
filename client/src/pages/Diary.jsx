// client/src/pages/Diary.jsx
import { useState, useEffect, useContext } from 'react';
import axios                    from 'axios';
import { AuthContext }          from '../context/AuthContext';
import MealCard                 from '../components/MealCard';
import SummaryBox               from '../components/SummaryBox';

// Diary page – main screen after login
export default function Diary() {
    const { token } = useContext(AuthContext);
    const [date, setDate]     = useState(() => new Date().toISOString().slice(0, 10));
    const [meals, setMeals]   = useState({});
    const [summary, setSum]   = useState(null);

    // Fetch diary data for the selected date
    const load = async () => {
        try {
            const { data } = await axios.get('/api/diary', {
                params:  { date },
                headers: { Authorization: `Bearer ${token}` }
            });
            setMeals(data.meals);
            setSum(data.summary);
        } catch {
            // Temporary stub until backend route exists
            setMeals({
                breakfast: { items: [] },
                lunch:     { items: [] },
                dinner:    { items: [] },
                snack:     { items: [] }
            });
            setSum({ kcal: 0, protein: 0, fat: 0, carbs: 0 });
        }
    };

    useEffect(() => { load(); }, [date]);

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-4">
            <input
                type="date"
                className="border p-1"
                value={date}
                onChange={e => setDate(e.target.value)}
            />

            {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                <MealCard
                    key={type}
                    type={type}
                    items={meals[type]?.items || []}
                    date={date}
                    reload={load}
                />
            ))}

            {summary && <SummaryBox summary={summary} />}
        </div>
    );
}

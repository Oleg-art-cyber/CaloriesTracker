// client/src/components/AddActivityModal.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function AddActivityModal({ date, onClose, reloadDiary }) {
    const { token } = useContext(AuthContext);
    // authHeader будет создан внутри useEffect или при отправке запроса,
    // чтобы не быть в зависимостях useEffect, если он не мемоизирован.
    // Либо, если мы хотим его использовать, мы должны мемоизировать его с useMemo.
    // Но проще всего использовать сам токен как зависимость.

    const [allExercises, setAllExercises] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExerciseId, setSelectedExerciseId] = useState('');
    const [duration, setDuration] = useState(30);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // console.log("AddActivityModal: useEffect for loading exercises triggered. Token:", token);
        if (token) {
            setIsLoading(true);
            const currentAuthHeader = { Authorization: `Bearer ${token}` }; // Create header inside effect
            axios.get('/api/exercises', { headers: currentAuthHeader })
                .then(res => {
                    // console.log("AddActivityModal: Exercises loaded:", res.data);
                    setAllExercises(Array.isArray(res.data) ? res.data : []);
                    // if (res.data.length > 0 && !selectedExerciseId) { // Only pre-select if nothing is selected
                    //    setSelectedExerciseId(res.data[0].id);
                    // }
                })
                .catch(e => {
                    console.error("AddActivityModal: Failed to load exercises", e);
                    setError("Could not load exercise list.");
                })
                .finally(() => setIsLoading(false));
        } else {
            // console.log("AddActivityModal: No token, not loading exercises.");
            setAllExercises([]); // Clear exercises if no token
        }
    }, [token]); // Dependency is only 'token'. When token changes, effect runs.

    const filteredExercises = searchTerm.trim() === ''
        ? allExercises
        : allExercises.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!selectedExerciseId) {
            setError('Please select an exercise.');
            return;
        }
        const numDuration = parseInt(duration, 10);
        if (isNaN(numDuration) || numDuration <= 0) {
            setError('Duration must be a positive number of minutes.');
            return;
        }

        const payload = {
            exercise_definition_id: Number(selectedExerciseId),
            duration_minutes: numDuration,
            activity_date: date,
        };

        setIsLoading(true);
        try {
            const currentAuthHeader = { Authorization: `Bearer ${token}` }; // Create header for this request
            await axios.post('/api/physical-activity', payload, { headers: currentAuthHeader });
            reloadDiary();
            onClose();
        } catch (err) {
            console.error("AddActivityModal: Failed to log activity", err);
            setError(err.response?.data?.error || 'Failed to log activity.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl w-full max-w-md space-y-4 shadow-xl">
                <h2 className="text-xl font-semibold text-center text-gray-700">Log Physical Activity</h2>

                <div>
                    <label htmlFor="exerciseSearchModal" className="block text-sm font-medium text-gray-700">Search Exercise</label>
                    <input
                        id="exerciseSearchModal"
                        name="exerciseSearchModal"
                        type="text"
                        placeholder="Type to search exercises..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="mt-1 w-full border p-2 rounded-md shadow-sm"
                    />
                </div>

                <div>
                    <label htmlFor="exerciseSelectModal" className="block text-sm font-medium text-gray-700">Select Exercise*</label>
                    <select
                        id="exerciseSelectModal"
                        name="exerciseSelectModal"
                        value={selectedExerciseId}
                        onChange={e => setSelectedExerciseId(e.target.value)}
                        className="mt-1 w-full border p-2 rounded-md shadow-sm"
                        required
                        disabled={isLoading && allExercises.length === 0}
                    >
                        <option value="" disabled>{isLoading && allExercises.length === 0 && !error ? "Loading..." : "Select an exercise"}</option>
                        {error && <option disabled>Error loading exercises</option>}
                        {!error && filteredExercises.map(ex => (
                            <option key={ex.id} value={ex.id}>
                                {ex.name}
                                {ex.met_value ? ` (MET: ${ex.met_value})` : ''}
                                {ex.calories_per_minute ? ` (${ex.calories_per_minute} kcal/min)`: ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="durationMinutesModal" className="block text-sm font-medium text-gray-700">Duration (minutes)*</label>
                    <input
                        id="durationMinutesModal"
                        name="durationMinutesModal"
                        type="number"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        min="1"
                        className="mt-1 w-full border p-2 rounded-md shadow-sm"
                        required
                    />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}

                <div className="flex justify-end gap-3 pt-3 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50">
                        {isLoading ? 'Logging...' : 'Log Activity'}
                    </button>
                </div>
            </form>
        </div>
    );
}
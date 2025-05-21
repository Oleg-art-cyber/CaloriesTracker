// client/src/pages/Exercises.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ExerciseForm from '../components/ExerciseForm'; // Будет создан ниже

export default function Exercises() {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    // decode JWT payload
    const payload = token ? JSON.parse(atob(token.split('.')[1])) : {};
    const isAdmin = payload.role === 'admin';
    const userId  = payload.id;

    const [list,    setList]    = useState([]);
    const [error,   setError]   = useState(null);
    const [adding,  setAdding]  = useState(false);
    const [editing, setEditing] = useState(null); // Хранит объект упражнения для редактирования

    const fetchExercises = async () => {
        try {
            const { data } = await axios.get('/api/exercises', {
                headers: authHeader
            });
            setList(Array.isArray(data) ? data : []);
            setError(null);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || 'Server error fetching exercises');
            setList([]);
        }
    };

    useEffect(() => {
        if (token) fetchExercises();
    }, [token]);

    const handleDelete = async (id) => {
        if (!confirm('Delete exercise definition? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/exercises/${id}`, {
                headers: authHeader
            });
            fetchExercises(); // Обновить список после удаления
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.error || 'Delete error');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Exercise Library</h2>
                {token && (
                    <button
                        onClick={() => setAdding(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    >
                        ＋ Add Exercise
                    </button>
                )}
            </div>

            {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

            {list.length === 0 && !error && <p className="text-gray-500 text-center">No exercises found. Add one to get started!</p>}

            <ul className="space-y-3">
                {list.map(ex => {
                    const canModify = isAdmin || ex.created_by === userId;
                    return (
                        <li
                            key={ex.id}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center border p-4 rounded-lg shadow-sm bg-white"
                        >
                            <div className="mb-2 sm:mb-0">
                                <p className="font-semibold text-lg">{ex.name}</p>
                                <p className="text-sm text-gray-600">
                                    {ex.description ? `${ex.description.substring(0,100)}${ex.description.length > 100 ? '...' : ''}` : <i>No description</i>}
                                </p>
                                <div className="text-xs text-gray-500 mt-1">
                                    {ex.met_value && <span>MET: {ex.met_value}</span>}
                                    {ex.calories_per_minute && <span> | Kcal/min: {ex.calories_per_minute}</span>}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${ex.is_public ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {ex.is_public ? 'Public' : 'Private'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-2 sm:mt-0 flex-shrink-0">
                                <button
                                    onClick={() => canModify && setEditing(ex)}
                                    disabled={!canModify}
                                    aria-disabled={!canModify}
                                    className={
                                        `text-blue-600 px-3 py-1 rounded ` +
                                        `${!canModify ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100 transition'}`
                                    }
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => canModify && handleDelete(ex.id)}
                                    disabled={!canModify}
                                    aria-disabled={!canModify}
                                    className={
                                        `text-red-600 px-3 py-1 rounded ` +
                                        `${!canModify ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100 transition'}`
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {adding && (
                <ExerciseForm onSuccess={fetchExercises} onClose={() => setAdding(false)} />
            )}
            {editing && (
                <ExerciseForm
                    exercise={editing}
                    onSuccess={fetchExercises}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
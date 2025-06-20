// client/src/pages/Exercises.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { AuthContext } from '../context/AuthContext';
import ExerciseForm from '../components/ExerciseForm.jsx';

/**
 * Exercises component for managing user exercises
 * Allows users to view, add, edit, and delete exercises
 */
export default function Exercises() {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const payload = token ? JSON.parse(atob(token.split('.')[1])) : {};
    const isAdmin = payload.role === 'admin';
    const userId = payload.id;

    const [exercises, setExercises] = useState([]);
    const [error, setError] = useState(null);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingDetailsForId, setIsLoadingDetailsForId] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);

    // Fetch users for admin filter
    useEffect(() => {
        if (isAdmin && token) {
            axios.get('/api/users', { headers: authHeader })
                .then(({ data }) => {
                    // Transform data for react-select
                    const options = data.map(user => ({
                        value: user.id,
                        label: user.name,
                        email: user.email
                    }));
                    setUsers(options);
                })
                .catch(console.error);
        }
    }, [isAdmin, token]);

    /**
     * Fetches the list of exercises from the server
     */
    const fetchExercises = async () => {
        if (!token) { setExercises([]); return; }
        setIsLoadingList(true);
        setError(null);
        try {
            const { data } = await axios.get('/api/exercises', { 
                headers: authHeader,
                params: { userId: selectedUserId || undefined }
            });
            setExercises(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Exercises: Failed to fetch exercises list:', e);
            setError(e.response?.data?.error || 'Server error fetching exercises list.');
            setExercises([]);
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => {
        fetchExercises();
    }, [token, selectedUserId]);

    const handleAdd = () => {
        setEditingExercise(null);
        setShowForm(true);
    };

    const handleViewOrEdit = async (exercise) => {
        setIsLoadingDetailsForId(exercise.id);
        try {
            const { data } = await axios.get(`/api/exercises/${exercise.id}`, { headers: authHeader });
            setEditingExercise(data);
            setShowForm(true);
        } catch (e) {
            console.error('Exercises: Failed to fetch exercise details:', e);
            setError(e.response?.data?.error || 'Server error fetching exercise details.');
        } finally {
            setIsLoadingDetailsForId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this exercise?')) return;
        try {
            await axios.delete(`/api/exercises/${id}`, { headers: authHeader });
            fetchExercises();
        } catch (e) {
            console.error('Exercises: Failed to delete exercise:', e);
            setError(e.response?.data?.error || 'Server error deleting exercise.');
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingExercise(null);
        fetchExercises();
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Exercises</h1>
                <button
                    onClick={handleAdd}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition duration-150 ease-in-out"
                >
                    + Create Exercise
                </button>
            </div>

            {/* User filter for admin */}
            {isAdmin && (
                <div className="mb-4">
                    <Select
                        value={users.find(u => u.value === selectedUserId) || null}
                        onChange={option => setSelectedUserId(option?.value || '')}
                        options={users}
                        isClearable
                        placeholder="Filter by user..."
                        noOptionsMessage={() => "No users found"}
                        formatOptionLabel={option => (
                            <div>
                                <div>{option.label}</div>
                                <div className="text-xs text-gray-500">{option.email}</div>
                            </div>
                        )}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                            control: (base) => ({
                                ...base,
                                minHeight: '38px',
                                borderColor: '#d1d5db',
                                '&:hover': {
                                    borderColor: '#9ca3af'
                                }
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isFocused ? '#f3f4f6' : 'white',
                                color: '#1f2937',
                                '&:active': {
                                    backgroundColor: '#e5e7eb'
                                }
                            })
                        }}
                    />
                </div>
            )}

            {error && <p className="text-red-600 text-center bg-red-100 p-3 rounded-md">{error}</p>}

            {!isLoadingList && exercises.length === 0 && !error && !showForm && (
                <p className="text-gray-500 text-center py-10">
                    {selectedUserId ? 'No exercises found for this user.' : 'You haven\'t created any exercises yet. Click "Create Exercise" to get started!'}
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exercises.map(exercise => {
                    const canModify = isAdmin || exercise.created_by === userId;
                    const isLoadingThisExercise = isLoadingDetailsForId === exercise.id;

                    return (
                        <div key={exercise.id} className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-xl">
                            <div className="p-5">
                                <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate" title={exercise.name}>{exercise.name}</h2>
                                <p className="text-sm text-gray-600 mb-1 h-10 overflow-y-hidden text-ellipsis">
                                    {exercise.description || <em>No description available.</em>}
                                </p>
                                <p className="text-xs text-gray-500 mb-3">
                                    {exercise.met_value ? `MET: ${exercise.met_value}` : ''}
                                    {exercise.calories_per_minute ? ` | ${exercise.calories_per_minute} kcal/min` : ''}
                                    <span className="block mt-1">
                                        Created by: {exercise.creator_name || 'Unknown'}
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${exercise.is_public ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {exercise.is_public ? 'Public' : 'Private'}
                                        </span>
                                    </span>
                                </p>
                            </div>
                            {canModify && (
                                <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end space-x-2">
                                    <button
                                        onClick={() => handleViewOrEdit(exercise)}
                                        disabled={isLoadingThisExercise}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1 px-3 rounded-md hover:bg-indigo-50 transition disabled:opacity-50"
                                    >
                                        {isLoadingThisExercise ? 'Loading...' : 'View / Edit'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(exercise.id)}
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
                <ExerciseForm
                    exercise={editingExercise}
                    onSuccess={fetchExercises}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
}
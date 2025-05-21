// client/src/components/ExerciseForm.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function ExerciseForm({ exercise, onSuccess, onClose }) {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const [form, setForm] = useState({
        name: '',
        description: '',
        met_value: '',
        calories_per_minute: '',
        is_public: false,
    });
    const [err, setErr] = useState(null);

    useEffect(() => {
        if (exercise) {
            setForm({
                name: exercise.name || '',
                description: exercise.description || '',
                met_value: exercise.met_value ? String(exercise.met_value) : '',
                calories_per_minute: exercise.calories_per_minute ? String(exercise.calories_per_minute) : '',
                is_public: exercise.is_public || false,
            });
        } else {
            setForm({
                name: '',
                description: '',
                met_value: '',
                calories_per_minute: '',
                is_public: false,
            });
        }
    }, [exercise]);

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setErr(null); // Сбросить ошибку при изменении
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErr(null);

        if (!form.name.trim()) {
            setErr('Exercise name is required.');
            return;
        }
        if (!form.met_value && !form.calories_per_minute) {
            setErr('Either MET value or Calories per minute must be provided.');
            return;
        }
        if (form.met_value && (isNaN(parseFloat(form.met_value)) || parseFloat(form.met_value) <= 0)) {
            setErr('MET value must be a positive number.');
            return;
        }
        if (form.calories_per_minute && (isNaN(parseFloat(form.calories_per_minute)) || parseFloat(form.calories_per_minute) <= 0)) {
            setErr('Calories per minute must be a positive number.');
            return;
        }


        const payload = {
            name: form.name,
            description: form.description.trim() ? form.description.trim() : null,
            met_value: form.met_value ? parseFloat(form.met_value) : null,
            calories_per_minute: form.calories_per_minute ? parseFloat(form.calories_per_minute) : null,
            is_public: form.is_public,
        };

        try {
            if (exercise) { // Редактирование
                await axios.put(`/api/exercises/${exercise.id}`, payload, { headers: authHeader });
            } else { // Создание
                await axios.post('/api/exercises', payload, { headers: authHeader });
            }
            onSuccess(); // Обновить список на родительской странице
            onClose();   // Закрыть модальное окно
        } catch (e) {
            console.error(e);
            setErr(e.response?.data?.error || 'Server error. Please try again.');
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-5 shadow-xl"
            >
                <h2 className="text-2xl font-semibold text-center text-gray-800">
                    {exercise ? 'Edit Exercise' : 'Add New Exercise'}
                </h2>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                        id="name"
                        name="name"
                        placeholder="e.g., Running, Push-ups"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Optional: A brief description of the exercise"
                        value={form.description}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="met_value" className="block text-sm font-medium text-gray-700 mb-1">MET Value</label>
                        <input
                            id="met_value"
                            type="number"
                            name="met_value"
                            placeholder="e.g., 7.0"
                            value={form.met_value}
                            onChange={handleChange}
                            step="0.1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="calories_per_minute" className="block text-sm font-medium text-gray-700 mb-1">Calories/minute</label>
                        <input
                            id="calories_per_minute"
                            type="number"
                            name="calories_per_minute"
                            placeholder="e.g., 10"
                            value={form.calories_per_minute}
                            onChange={handleChange}
                            step="0.1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-500">Provide either MET value or Calories per minute.</p>


                <div className="flex items-center">
                    <input
                        id="is_public"
                        name="is_public"
                        type="checkbox"
                        checked={form.is_public}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                        Make this exercise public (visible to all users)
                    </label>
                </div>


                {err && <p className="text-red-600 text-center text-sm py-2 bg-red-50 rounded-md">{err}</p>}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        {exercise ? 'Update Exercise' : 'Save Exercise'}
                    </button>
                </div>
            </form>
        </div>
    );
}
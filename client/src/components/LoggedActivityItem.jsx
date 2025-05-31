// client/src/components/LoggedActivityItem.jsx
import React from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const LoggedActivityItem = React.memo(function LoggedActivityItem({ activity, reloadDiary }) {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to remove "${activity.exercise_name || activity.activity_type || 'this activity'}"?`)) return;
        try {
            await axios.delete(`/api/physical-activity/${activity.id}`, { headers: authHeader });
            if (reloadDiary) reloadDiary();
        } catch (e) {
            console.error("Failed to delete activity:", e);
            alert(e.response?.data?.error || "Could not delete activity.");
        }
    };

    return (
        <li className="flex justify-between items-center p-3 bg-white rounded-md shadow-sm border border-gray-200">
            <div>
                <p className="font-medium text-gray-800">{activity.exercise_name || activity.activity_type || 'Logged Activity'}</p>
                <p className="text-sm text-gray-600">
                    {activity.duration_minutes} min - Burned: {Math.round(activity.calories_burned || 0)} kcal
                </p>
            </div>
            <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                title="Remove activity"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </li>
    );
});

export default LoggedActivityItem;
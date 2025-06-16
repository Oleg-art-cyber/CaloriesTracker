import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

export default function NewUsersModal({ isOpen, onClose, startDate, endDate }) {
    const { token } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && token) {
            setIsLoading(true);
            setError(null);

            // Validate dates
            if (!startDate || !endDate) {
                setError("Start date and end date are required");
                setIsLoading(false);
                return;
            }

            try {
                // Parse dates and validate
                const start = new Date(startDate + 'T00:00:00Z');
                const end = new Date(endDate + 'T23:59:59Z');

                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    throw new Error("Invalid date format");
                }

                if (start > end) {
                    throw new Error("Start date cannot be after end date");
                }

                // Format dates to YYYY-MM-DD
                const formattedStartDate = startDate;
                const formattedEndDate = endDate;

                console.log('Sending date range:', { formattedStartDate, formattedEndDate });

                axios.get('/api/admin/users/new', {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        startDate: formattedStartDate,
                        endDate: formattedEndDate
                    }
                })
                .then(response => {
                    console.log('Received users data:', response.data);
                    if (!Array.isArray(response.data)) {
                        throw new Error('Invalid response format');
                    }
                    setUsers(response.data);
                })
                .catch(err => {
                    console.error("Failed to fetch new users:", err);
                    setError(err.response?.data?.error || "Could not load new users data.");
                    setUsers([]);
                })
                .finally(() => {
                    setIsLoading(false);
                });
            } catch (err) {
                console.error("Date validation error:", err);
                setError(err.message);
                setIsLoading(false);
                setUsers([]);
            }
        }
    }, [isOpen, token, startDate, endDate]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            New Users
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                        <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                    {isLoading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading users...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4 text-red-500 dark:text-red-400">
                            {error}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            No new users found in this period
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {users.map(user => {
                                if (!user.id) {
                                    console.error('Invalid user data:', user);
                                    return null;
                                }
                                return (
                                    <div
                                        key={user.id}
                                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                                                <FontAwesomeIcon
                                                    icon={faUser}
                                                    className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                    {user.name || 'Unknown User'}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {user.email || 'No email provided'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Role: <span className={`font-semibold ${user.role === 'admin' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        {user.role || 'user'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                            <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4" />
                                            <span>
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown date'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
} 
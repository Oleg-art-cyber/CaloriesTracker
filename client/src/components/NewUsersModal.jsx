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

    /* ---------------------------------- Effects ---------------------------------- */
    useEffect(() => {
        // fetch only when modal is open and token exists
        if (isOpen && token) {
            setIsLoading(true);
            setError(null);

            // client-side date validation first
            if (!startDate || !endDate) {
                setError('Start date and end date are required');
                setIsLoading(false);
                return;
            }

            try {
                const start = new Date(`${startDate}T00:00:00Z`);
                const end = new Date(`${endDate}T23:59:59Z`);
                if (isNaN(start.getTime()) || isNaN(end.getTime()))
                    throw new Error('Invalid date format');
                if (start > end)
                    throw new Error('Start date cannot be after end date');

                axios
                    .get('/api/admin/users/new', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        params: { startDate, endDate },
                    })
                    .then((response) => {
                        if (!Array.isArray(response.data))
                            throw new Error('Invalid response format');
                        setUsers(response.data);
                    })
                    .catch((err) => {
                        console.error('Failed to fetch new users:', err);
                        setError(
                            err.response?.data?.error ||
                                'Could not load new users data.',
                        );
                        setUsers([]);
                    })
                    .finally(() => setIsLoading(false));
            } catch (err) {
                console.error('Date validation error:', err);
                setError(err.message);
                setIsLoading(false);
                setUsers([]);
            }
        }
    }, [isOpen, token, startDate, endDate]);

    /* --------------------------------- Early exit -------------------------------- */
    if (!isOpen) return null;

    /* ------------------------------- Render section ------------------------------ */
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4 animate-fadeIn">
            <div className="bg-white p-6 rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800">
                            New Users
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Period:{' '}
                            {`${new Date(startDate).toLocaleDateString()} – ${new Date(
                                endDate,
                            ).toLocaleDateString()}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-grow space-y-4">
                    {isLoading && (
                        <div className="py-6 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                            <p className="mt-2">Loading users...</p>
                        </div>
                    )}

                    {error && (
                        <div className="my-2 text-center text-red-500 bg-red-100 p-2 rounded-md">
                            {error}
                        </div>
                    )}

                    {!isLoading && users.length === 0 && !error && (
                        <p className="py-6 text-center text-gray-500">
                            No new users found in this period.
                        </p>
                    )}

                    {!isLoading &&
                        users.length > 0 &&
                        users.map((user) => {
                            // guard against malformed user object
                            if (!user.id) {
                                console.error('Invalid user data:', user);
                                return null;
                            }
                            return (
                                <div
                                    key={user.id}
                                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-indigo-100 p-3 rounded-full">
                                            <FontAwesomeIcon
                                                icon={faUser}
                                                className="h-5 w-5 text-indigo-600"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {user.name || 'Unknown User'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {user.email || 'No email provided'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Role:{' '}
                                                <span
                                                    className={`font-semibold ${
                                                        user.role === 'admin'
                                                            ? 'text-red-600'
                                                            : 'text-green-600'
                                                    }`}
                                                >
                                                    {user.role || 'user'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                        <FontAwesomeIcon
                                            icon={faCalendarAlt}
                                            className="h-4 w-4"
                                        />
                                        <span>
                                            {user.created_at
                                                ? new Date(
                                                      user.created_at,
                                                  ).toLocaleDateString()
                                                : 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* Footer */}
                <div className="pt-4 mt-4 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// client/src/components/AdminUserManagementModal.jsx
import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AdminUserEditModal from './AdminUserEditModal';
import Pagination from './Pagination';
import useDebounce from '../hooks/useDebounce';

/**
 * AdminUserManagementModal component for managing users in the system
 * Provides functionality for viewing, searching, editing, and deleting users
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Callback function to close the modal
 */
export default function AdminUserManagementModal({ isOpen, onClose }) {
    const { token } = useContext(AuthContext);
    const currentUserData = token ? JSON.parse(atob(token.split('.')[1])) : null;

    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [editingUser, setEditingUser] = useState(null);
    const [showEditUserModal, setShowEditUserModal] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const usersPerPage = 8;

    /**
     * Fetches paginated and filtered list of users from the backend
     * Updates state with user data and pagination information
     * @param {number} page - Page number to fetch
     * @param {string} search - Search term for filtering users
     */
    const fetchUsers = useCallback(async (page = 1, search = debouncedSearchTerm) => {
        if (!token) {
            setError("Authentication required for user management.");
            setIsLoading(false);
            setUsers([]);
            setTotalUsers(0);
            setTotalPages(1);
            return;
        }

        setIsLoading(true);
        setError(null);

        const localAuthHeader = { Authorization: `Bearer ${token}` };

        try {
            const response = await axios.get('/api/admin/users', {
                headers: localAuthHeader,
                params: {
                    page: page,
                    limit: usersPerPage,
                    q: search.trim() || undefined
                }
            });
            setUsers(response.data.data || []);
            setTotalUsers(response.data.total || 0);
            setTotalPages(Math.ceil((response.data.total || 0) / usersPerPage));
            setCurrentPage(response.data.page || 1);
        } catch (err) {
            console.error("AdminUserManagementModal: Failed to fetch users:", err);
            setError(err.response?.data?.error || "Could not load users.");
            setUsers([]);
            setTotalUsers(0);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [token, debouncedSearchTerm, usersPerPage]);

    /**
     * Loads users when modal is opened or search term changes
     * Resets success and error messages
     */
    useEffect(() => {
        if (isOpen) {
            setSuccessMessage('');
            setError(null);
            fetchUsers(1, debouncedSearchTerm);
        }
    }, [isOpen, debouncedSearchTerm, fetchUsers]);

    /**
     * Deletes a user after confirmation
     * Prevents self-deletion and updates the user list
     * @param {number} userIdToDelete - ID of the user to delete
     * @param {string} userName - Name of the user to delete
     */
    const handleDeleteUser = async (userIdToDelete, userName) => {
        if (currentUserData && userIdToDelete === currentUserData.id) return;
        if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;

        try {
            setIsLoading(true);
            const localAuthHeader = { Authorization: `Bearer ${token}` };
            await axios.delete(`/api/admin/users/${userIdToDelete}`, { headers: localAuthHeader });

            setSuccessMessage(`User "${userName}" (ID: ${userIdToDelete}) deleted successfully.`);
            const newTotal = totalUsers - 1;
            const newTotalPgs = Math.ceil(newTotal / usersPerPage);

            let pageToFetch = currentPage;
            if (currentPage > newTotalPgs && newTotalPgs > 0) {
                pageToFetch = newTotalPgs;
            } else if (newTotal === 0) {
                pageToFetch = 1;
            }

            fetchUsers(pageToFetch, debouncedSearchTerm);
        } catch (err) {
            console.error("AdminUserManagementModal: Failed to delete user:", err);
            setError(err.response?.data?.error || "Failed to delete user.");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Opens the edit modal with selected user data
     * @param {Object} user - User data to edit
     */
    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowEditUserModal(true);
    };

    /**
     * Closes the edit modal and optionally refreshes the user list
     * @param {boolean} refresh - Whether to refresh the user list
     */
    const handleEditModalClose = (refresh) => {
        setShowEditUserModal(false);
        setEditingUser(null);
        if (refresh) {
            fetchUsers(currentPage, debouncedSearchTerm);
        }
    };

    if (!isOpen) return null;

    // Renders the modal content with search, table, pagination, and edit modal
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-4xl space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">User Management</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white text-2xl">×</button>
                </div>

                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-2/3 md:w-1/2 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />

                {isLoading && <p className="text-center text-gray-500 dark:text-gray-300 py-6">Loading users...</p>}
                {error && <p className="my-2 text-center text-red-500 bg-red-100 p-2 rounded-md">{error}</p>}
                {successMessage && <p className="my-2 text-center text-green-500 bg-green-100 p-2 rounded-md">{successMessage}</p>}

                <div className="overflow-x-auto flex-grow">
                    {!isLoading && users.length === 0 && !error && <p className="text-center text-gray-500 py-6">No users found.</p>}
                    {!isLoading && users.length > 0 && (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-4 py-3 text-sm">{user.id}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                                    <td className="px-4 py-3 text-sm">{user.email}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                                            : 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right text-sm space-x-2">
                                        <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:underline">Edit</button>
                                        {currentUserData?.id !== user.id && (
                                            <button onClick={() => handleDeleteUser(user.id, user.name)} className="text-red-600 hover:underline">Delete</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalUsers > 0 && totalPages > 1 && !isLoading && (
                    <div className="pt-4 border-t dark:border-gray-700">
                        <Pagination
                            page={currentPage}
                            total={totalUsers}
                            limit={usersPerPage}
                            onPage={(newPage) => fetchUsers(newPage, debouncedSearchTerm)}
                        />
                    </div>
                )}

                {showEditUserModal && editingUser && (
                    <AdminUserEditModal
                        userToEdit={editingUser}
                        onClose={handleEditModalClose}
                    />
                )}
            </div>
        </div>
    );
}

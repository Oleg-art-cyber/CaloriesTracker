// client/src/components/AdminUserEditModal.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

/**
 * AdminUserEditModal component for editing user profile details as an administrator
 * Allows updating user role and personal data
 * @param {Object} userToEdit - User data to edit
 * @param {Function} onClose - Callback function to close the modal
 */
export default function AdminUserEditModal({ userToEdit, onClose }) {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
        weight: '',
        height: '',
        age: '',
        gender: '',
        activity_level: 'sedentary',
        // newPassword: '' // Optional: if password reset is needed
    });

    const [originalEmail, setOriginalEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    /**
     * Initializes form fields with data from the user being edited
     */
    useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name || '',
                email: userToEdit.email || '',
                role: userToEdit.role || 'user',
                weight: userToEdit.weight || '',
                height: userToEdit.height || '',
                age: userToEdit.age || '',
                gender: userToEdit.gender || '',
                activity_level: userToEdit.activity_level || 'sedentary',
            });
            setOriginalEmail(userToEdit.email || '');
        }
    }, [userToEdit]);

    /**
     * Handles changes in any form field
     * Updates form state and clears error/success messages
     * @param {Event} e - Form input change event
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    /**
     * Sends updated user data to the server
     * Handles form submission and error/success feedback
     * @param {Event} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        const payload = { ...formData };
        payload.weight = payload.weight ? parseFloat(payload.weight) : null;
        payload.height = payload.height ? parseFloat(payload.height) : null;
        payload.age = payload.age ? parseInt(payload.age) : null;
        if (payload.gender === '') payload.gender = null;
        if (payload.activity_level === '') payload.activity_level = null;

        // Do not send unchanged email
        if (payload.email === originalEmail) {
            delete payload.email;
        }

        try {
            await axios.put(`/api/admin/users/${userToEdit.id}`, payload, { headers: authHeader });
            setSuccess('User updated successfully!');
            setTimeout(() => {
                onClose(true); // Request parent to refresh list
            }, 1500);
        } catch (err) {
            console.error("Failed to update user by admin:", err);
            setError(err.response?.data?.error || "Failed to update user.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!userToEdit) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg space-y-4 shadow-2xl">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white text-center">
                    Edit User: {userToEdit.name} (ID: {userToEdit.id})
                </h2>

                <div>
                    <label htmlFor="adminEditUserName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input type="text" name="name" id="adminEditUserName" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                <div>
                    <label htmlFor="adminEditUserEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input type="email" name="email" id="adminEditUserEmail" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                <div>
                    <label htmlFor="adminEditUserRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                    <select name="role" id="adminEditUserRole" value={formData.role} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {/*
                // Optional password reset support
                <div>
                    <label htmlFor="adminEditUserNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        New Password (leave blank to keep current)
                    </label>
                    <input type="password" name="newPassword" id="adminEditUserNewPassword" value={formData.newPassword} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                */}

                <h3 className="text-md font-semibold pt-4 border-t dark:border-gray-700 text-gray-700 dark:text-gray-200">Profile Details (Optional)</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="adminEditUserWeight" className="text-sm">Weight (kg)</label>
                        <input type="number" name="weight" id="adminEditUserWeight" step="0.1" value={formData.weight} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="adminEditUserHeight" className="text-sm">Height (cm)</label>
                        <input type="number" name="height" id="adminEditUserHeight" step="0.1" value={formData.height} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="adminEditUserAge" className="text-sm">Age</label>
                        <input type="number" name="age" id="adminEditUserAge" value={formData.age} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="adminEditUserGender" className="text-sm">Gender</label>
                        <select name="gender" id="adminEditUserGender" value={formData.gender || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="">Not Set</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="adminEditUserActivityLevel" className="text-sm">Activity Level</label>
                        <select name="activity_level" id="adminEditUserActivityLevel" value={formData.activity_level || 'sedentary'} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="sedentary">Sedentary</option>
                            <option value="light">Light</option>
                            <option value="moderate">Moderate</option>
                            <option value="active">Active</option>
                            <option value="very_active">Very Active</option>
                        </select>
                    </div>
                </div>

                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                {success && <p className="text-sm text-green-600 bg-green-100 p-2 rounded-md">{success}</p>}

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={() => onClose(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

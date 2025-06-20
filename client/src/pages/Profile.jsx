// client/src/pages/Profile.jsx
import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

/**
 * Default profile state with empty values
 */
const DEFAULT_PROFILE = {
    name: '', email: '', weight: '', height: '', age: '',
    goal: 'maintain', gender: '', activity_level: 'sedentary',
    bmr_formula: 'mifflin_st_jeor', body_fat_percentage: '',
    target_calories_override: '',
    bmr: null,
    calculated_tdee: null,
    calculated_target_calories: null,
};

/**
 * Activity level options for user selection
 */
const ACTIVITY_LEVEL_OPTIONS = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'light', label: 'Lightly Active (light exercise/sports 1-3 days/wk)' },
    { value: 'moderate', label: 'Moderately Active (moderate exercise/sports 3-5 days/wk)' },
    { value: 'active', label: 'Active (hard exercise/sports 6-7 days/wk)' },
    { value: 'very_active', label: 'Very Active (very hard exercise & physical job)' },
];

/**
 * BMR formula options for calorie calculation
 */
const BMR_FORMULA_OPTIONS = [
    { value: 'mifflin_st_jeor', label: 'Mifflin-St Jeor (Recommended)' },
    { value: 'harris_benedict', label: 'Harris-Benedict (Revised)' },
    { value: 'katch_mcardle', label: 'Katch-McArdle (Needs Body Fat %)' },
];

/**
 * Activity level multipliers for TDEE calculation
 */
const APPROX_ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
};

/**
 * Profile page component for managing user profile information
 * Handles user's personal details, physical stats, goals, and calorie calculation preferences
 */
export default function ProfilePage() {
    const { token } = useContext(AuthContext);

    const [profile, setProfile] = useState(DEFAULT_PROFILE);
    const [initialProfile, setInitialProfile] = useState(DEFAULT_PROFILE);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    /**
     * Fetches user profile data from the server
     * Updates state with fetched data or sets default values if not authenticated
     */
    const fetchProfile = useCallback(async () => {
        if (!token) { setIsLoading(false); setProfile(DEFAULT_PROFILE); setInitialProfile(DEFAULT_PROFILE); return; }
        setIsLoading(true); setError(''); setSuccessMessage('');
        try {
            const localAuthHeader = { Authorization: `Bearer ${token}` };
            const { data } = await axios.get('/api/profile', { headers: localAuthHeader });
            const fetchedProfile = {
                ...DEFAULT_PROFILE, ...data,
                weight: data.weight !== null && data.weight !== undefined ? String(data.weight) : '',
                height: data.height !== null && data.height !== undefined ? String(data.height) : '',
                age: data.age !== null && data.age !== undefined ? String(data.age) : '',
                body_fat_percentage: data.body_fat_percentage !== null && data.body_fat_percentage !== undefined ? String(data.body_fat_percentage) : '',
                target_calories_override: data.target_calories_override !== null && data.target_calories_override !== undefined ? String(data.target_calories_override) : '',
                gender: data.gender || '',
                activity_level: data.activity_level || 'sedentary',
                bmr_formula: data.bmr_formula || 'mifflin_st_jeor',
                bmr: data.bmr !== null && data.bmr !== undefined ? data.bmr : null,
            };
            setProfile(fetchedProfile);
            setInitialProfile(fetchedProfile);
        } catch (err) {
            console.error("ProfilePage: Failed to fetch profile:", err);
            setError(err.response?.data?.error || "Could not load your profile data.");
            setProfile(DEFAULT_PROFILE);
            setInitialProfile(DEFAULT_PROFILE);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    /**
     * Handles changes in form inputs
     * @param {Event} e - Input change event
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccessMessage('');
    };

    /**
     * Handles form submission for profile updates
     * Validates input data and sends update request to server
     * @param {Event} e - Form submit event
     */
    const handleSave = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMessage(''); setIsSaving(true);
        const payload = {
            name: profile.name.trim(), email: profile.email.trim(),
            weight: profile.weight !== '' ? parseFloat(profile.weight) : null,
            height: profile.height !== '' ? parseFloat(profile.height) : null,
            age: profile.age !== '' ? parseInt(profile.age) : null,
            goal: profile.goal, gender: profile.gender === '' ? null : profile.gender,
            activity_level: profile.activity_level, bmr_formula: profile.bmr_formula,
            body_fat_percentage: profile.body_fat_percentage !== '' && !isNaN(parseFloat(profile.body_fat_percentage)) ? parseFloat(profile.body_fat_percentage) : null,
            target_calories_override: profile.target_calories_override !== '' && !isNaN(parseInt(profile.target_calories_override)) ? parseInt(profile.target_calories_override) : null,
        };
        if (!payload.name) { setError("Name is required."); setIsSaving(false); return; }
        if (payload.email && !/\S+@\S+\.\S+/.test(payload.email)) { setError("Invalid email format."); setIsSaving(false); return; }
        if (payload.weight !== null && (isNaN(payload.weight) || payload.weight <= 0)) { setError("Weight must be a positive number."); setIsSaving(false); return; }
        if (payload.height !== null && (isNaN(payload.height) || payload.height <= 0)) { setError("Height must be a positive number."); setIsSaving(false); return; }
        if (payload.age !== null && (isNaN(payload.age) || payload.age <= 0 || payload.age > 120)) { setError("Age must be a realistic positive number."); setIsSaving(false); return; }
        if (payload.body_fat_percentage !== null && (isNaN(payload.body_fat_percentage) || payload.body_fat_percentage < 0 || payload.body_fat_percentage >= 100)) { setError("Body fat % must be between 0-99.9."); setIsSaving(false); return; }
        if (payload.target_calories_override !== null && (isNaN(payload.target_calories_override) || payload.target_calories_override < 0)) {setError("Manual target calories must be non-negative."); setIsSaving(false); return; }

        try {
            const localAuthHeader = { Authorization: `Bearer ${token}` };
            const { data: updatedProfileDataFromServer } = await axios.put('/api/profile', payload, { headers: localAuthHeader });
            const updatedProfileForState = {
                ...DEFAULT_PROFILE, ...updatedProfileDataFromServer,
                weight: updatedProfileDataFromServer.weight !== null && updatedProfileDataFromServer.weight !== undefined ? String(updatedProfileDataFromServer.weight) : '',
                height: updatedProfileDataFromServer.height !== null && updatedProfileDataFromServer.height !== undefined ? String(updatedProfileDataFromServer.height) : '',
                age: updatedProfileDataFromServer.age !== null && updatedProfileDataFromServer.age !== undefined ? String(updatedProfileDataFromServer.age) : '',
                body_fat_percentage: updatedProfileDataFromServer.body_fat_percentage !== null && updatedProfileDataFromServer.body_fat_percentage !== undefined ? String(updatedProfileDataFromServer.body_fat_percentage) : '',
                target_calories_override: updatedProfileDataFromServer.target_calories_override !== null && updatedProfileDataFromServer.target_calories_override !== undefined ? String(updatedProfileDataFromServer.target_calories_override) : '',
                gender: updatedProfileDataFromServer.gender || '',
                activity_level: updatedProfileDataFromServer.activity_level || 'sedentary',
                bmr_formula: updatedProfileDataFromServer.bmr_formula || 'mifflin_st_jeor',
                bmr: updatedProfileDataFromServer.bmr !== null && updatedProfileDataFromServer.bmr !== undefined ? updatedProfileDataFromServer.bmr : null,
            };
            setProfile(updatedProfileForState);
            setInitialProfile(updatedProfileForState);
            setSuccessMessage('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) { setError(err.response?.data?.error || "Failed to update profile.");
        } finally { setIsSaving(false); }
    };

    /**
     * Handles cancellation of profile editing
     * Resets form to initial state
     */
    const handleCancelEdit = () => {
        setProfile(initialProfile);
        setIsEditing(false); setError(''); setSuccessMessage('');
    };

    const displayTargetKcal =
        profile.target_calories_override && parseInt(profile.target_calories_override) > 0
            ? parseInt(profile.target_calories_override)
            : (profile.calculated_target_calories !== null ? profile.calculated_target_calories : 0);

    if (isLoading && !initialProfile.name) {
        return <p className="text-center text-gray-500 p-10">Loading profile...</p>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center">My Profile</h1>

            {error && <p className="mb-4 text-center text-red-500 bg-red-100 p-3 rounded-md animate-shake">{error}</p>}
            {successMessage && <p className="mb-4 text-center text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

            <form onSubmit={handleSave} className="bg-white shadow-xl rounded-lg p-6 sm:p-8 space-y-6">
                {/* Personal Info */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" name="name" id="name" value={profile.name} onChange={handleChange} disabled={!isEditing} required
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" id="email" value={profile.email} onChange={handleChange} disabled={!isEditing} required
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        </div>
                        <div>
                            <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age (years)</label>
                            <input type="number" name="age" id="age" value={profile.age} onChange={handleChange} disabled={!isEditing} min="1"
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        </div>
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                            <select name="gender" id="gender" value={profile.gender || ''} onChange={handleChange} disabled={!isEditing}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed">
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Physical Stats */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 pt-4">Physical Stats</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                            <input type="number" name="weight" id="weight" step="0.1" value={profile.weight} onChange={handleChange} disabled={!isEditing} min="1"
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        </div>
                        <div>
                            <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
                            <input type="number" name="height" id="height" step="0.1" value={profile.height} onChange={handleChange} disabled={!isEditing} min="1"
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="body_fat_percentage" className="block text-sm font-medium text-gray-700">Body Fat % <span className="text-xs">(Optional)</span></label>
                            <input type="number" name="body_fat_percentage" id="body_fat_percentage" step="0.1" min="0" max="99.9" value={profile.body_fat_percentage} onChange={handleChange} disabled={!isEditing}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        </div>
                    </div>
                </section>

                {/* Goals and Activity */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 pt-4">Goals & Activity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label htmlFor="goal" className="block text-sm font-medium text-gray-700">Primary Goal</label>
                            <select name="goal" id="goal" value={profile.goal} onChange={handleChange} disabled={!isEditing}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed">
                                <option value="maintain">Maintain weight</option>
                                <option value="lose">Lose weight</option>
                                <option value="gain">Gain weight</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="activity_level" className="block text-sm font-medium text-gray-700">Activity Level</label>
                            <select name="activity_level" id="activity_level" value={profile.activity_level} onChange={handleChange} disabled={!isEditing}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed">
                                {ACTIVITY_LEVEL_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>
                {/* Calorie Calculation Settings */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 pt-4">Calorie Calculation Preferences</h2>
                    <div>
                        <label htmlFor="bmr_formula" className="block text-sm font-medium text-gray-700">BMR Formula</label>
                        <select name="bmr_formula" id="bmr_formula" value={profile.bmr_formula} onChange={handleChange} disabled={!isEditing}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed">
                            {BMR_FORMULA_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {profile.bmr_formula === 'katch_mcardle' &&
                            (!profile.body_fat_percentage || parseFloat(profile.body_fat_percentage) <= 0) &&
                            isEditing && (
                                <p className="text-xs text-yellow-600 mt-1">
                                    Katch-McArdle formula is most accurate with a Body Fat % &gt; 0.
                                </p>
                            )}
                    </div>
                    <div className="mt-4">
                        <label htmlFor="target_calories_override" className="block text-sm font-medium text-gray-700">Set Manual Target Calories (kcal)</label>
                        <input type="number" name="target_calories_override" id="target_calories_override" placeholder="Calculated if blank" value={profile.target_calories_override} onChange={handleChange} disabled={!isEditing} min="0"
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        <p className="text-xs text-gray-500 mt-1">Overrides the calculated target if a value is entered.</p>
                    </div>
                </section>

                {/* Display Calculated Values */}
                <section className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Estimated Daily Needs <span className="text-xs text-gray-500">(Calculated by server)</span></h3>
                    <div className="space-y-1 text-sm text-gray-700">
                        <p><strong>BMR (Basal Metabolic Rate):</strong> {profile.bmr !== null ? `${profile.bmr} kcal` : 'N/A (Fill profile data)'}</p>
                        <p><strong>TDEE (Maintenance Calories):</strong> {profile.calculated_tdee !== null ? `${profile.calculated_tdee} kcal` : 'N/A'}</p>
                        <p className="font-semibold text-indigo-700 text-md pt-1">
                            Your Target Calories: {displayTargetKcal > 0 ? `${displayTargetKcal} kcal` : 'N/A'}
                            {profile.target_calories_override && parseInt(profile.target_calories_override) > 0 && <span className="text-xs text-gray-500 ml-1">(Manually Set)</span>}
                        </p>
                    </div>
                </section>

                {/* Action Buttons */}
                <div className="pt-6 border-t mt-6">
                    <div className="flex justify-end space-x-3">
                        {isEditing ? (
                            <>
                                <button type="button" onClick={handleCancelEdit}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSaving || isLoading}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button type="button" onClick={() => { setIsEditing(true); setSuccessMessage(''); setError(''); }}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
// client/src/pages/AchievementsPage.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AchievementBadge from '../components/AchievementBadge';

/**
 * AchievementsPage component for displaying user achievements grouped by category
 */
export default function AchievementsPage() {
    const { token } = useContext(AuthContext);
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const [achievements, setAchievements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Group achievements by category
    const [groupedAchievements, setGroupedAchievements] = useState({});

    /**
     * Fetches achievements from the server and groups them by category
     */
    useEffect(() => {
        if (token) {
            setIsLoading(true);
            setError(null);
            axios.get('/api/achievements', { headers: authHeader })
                .then(response => {
                    const data = Array.isArray(response.data) ? response.data : [];
                    setAchievements(data);

                    // Group achievements
                    const groups = data.reduce((acc, ach) => {
                        const category = ach.category || 'General';
                        if (!acc[category]) {
                            acc[category] = { earned: [], locked: [] };
                        }
                        if (ach.is_earned) {
                            acc[category].earned.push(ach);
                        } else {
                            acc[category].locked.push(ach);
                        }
                        return acc;
                    }, {});
                    setGroupedAchievements(groups);
                })
                .catch(err => {
                    console.error("Failed to fetch achievements:", err);
                    setError(err.response?.data?.error || "Could not load achievements.");
                    setAchievements([]);
                    setGroupedAchievements({});
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
            setAchievements([]);
            setGroupedAchievements({});
        }
    }, [token]); // authHeader is derived from token, so token is the main dependency

    if (isLoading) {
        return <p className="text-center text-gray-500">Loading achievements...</p>;
    }

    if (error) {
        return <p className="text-red-600 text-center bg-red-100 p-3 rounded-md">{error}</p>;
    }

    const categories = Object.keys(groupedAchievements).sort(); // Sort categories alphabetically

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold text-center text-gray-800">My Achievements</h1>

            {categories.length === 0 && !isLoading && (
                <p className="text-center text-gray-500">
                    No achievements available yet. Keep up your healthy habits!
                </p>
            )}

            {categories.map(categoryName => (
                <section key={categoryName} className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b-2 border-gray-200 pb-2">
                        {categoryName}
                    </h2>

                    {/* Earned Achievements in this category */}
                    {groupedAchievements[categoryName]?.earned?.length > 0 && (
                        <div className="mb-8">
                            {/* Optional: Sub-header for earned if you want visual distinction beyond badge style */}
                            {/* <h3 className="text-xl font-medium text-green-600 dark:text-green-400 mb-3">Unlocked</h3> */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                {groupedAchievements[categoryName].earned.map(ach => (
                                    <AchievementBadge key={ach.id} achievement={ach} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Locked Achievements in this category */}
                    {groupedAchievements[categoryName]?.locked?.length > 0 && (
                        <div>
                            {/* Optional: Sub-header if earned list was empty or to separate more clearly */}
                            {groupedAchievements[categoryName]?.earned?.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No achievements unlocked in this category yet.</p>
                            )}
                            <h3 className="text-xl font-medium text-gray-500 mb-3">
                                {groupedAchievements[categoryName]?.earned?.length > 0 ? 'Still Locked' : 'Locked Achievements'}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                {groupedAchievements[categoryName].locked.map(ach => (
                                    <AchievementBadge key={ach.id} achievement={ach} />
                                ))}
                            </div>
                        </div>
                    )}
                    {groupedAchievements[categoryName]?.earned?.length === 0 && groupedAchievements[categoryName]?.locked?.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No achievements defined for this category yet.</p>
                    )}
                </section>
            ))}
        </div>
    );
}
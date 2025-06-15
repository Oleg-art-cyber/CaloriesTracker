// client/src/pages/AdminStatisticsPage.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom'; // useNavigate не нужен, если это модальное окно
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers, faUserPlus, faBoxOpen, faUtensils as faRecipe, faDumbbell,
    faClipboardList, faFire, faChartLine,
    faAppleAlt, faDrumstickBite, faBacon, faBreadSlice,
    faUsersCog
} from '@fortawesome/free-solid-svg-icons';
import AdminUserManagementModal from '../components/AdminUserManagementModal'; // <-- ИМПОРТ МОДАЛЬНОГО ОКНА

const StatCard = ({ title, value, subValue, icon, iconColor = 'text-indigo-500 dark:text-indigo-400', bgColor = 'bg-white dark:bg-gray-800' }) => (
    <div className={`${bgColor} p-6 rounded-xl shadow-lg flex items-start space-x-4`}>
        {icon && (
            <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconColor.replace('text-', 'bg-').replace('-500', '-100').replace('-400', '-800')} bg-opacity-50 dark:bg-opacity-30`}>
                <FontAwesomeIcon icon={icon} className={`h-6 w-6 ${iconColor}`} />
            </div>
        )}
        <div className="min-w-0 flex-1">
            <h3
                className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                title={title}
            >
                {title}
            </h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
            {subValue && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" title={subValue}>{subValue}</p>}
        </div>
    </div>
);

export default function AdminStatisticsPage() {
    const { token } = useContext(AuthContext);
    // const navigate = useNavigate(); // Не нужен для модального окна

    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPeriodDays, setSelectedPeriodDays] = useState(7);

    const [showUserManagementModal, setShowUserManagementModal] = useState(false); // <-- НОВОЕ СОСТОЯНИЕ

    useEffect(() => {
        if (token) {
            setIsLoading(true);
            setError(null);
            const authHeader = { Authorization: `Bearer ${token}` };

            axios.get('/api/admin/statistics', {
                headers: authHeader,
                params: { period_days: selectedPeriodDays }
            })
                .then(response => {
                    setStats(response.data);
                })
                .catch(err => {
                    console.error("Failed to fetch admin statistics:", err);
                    setError(err.response?.data?.error || "Could not load admin statistics.");
                    setStats(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
            setError("Admin access required. Please log in.");
            setStats(null);
        }
    }, [token, selectedPeriodDays]);

    const handlePeriodChange = (event) => {
        setSelectedPeriodDays(Number(event.target.value));
    };

    // Теперь этот обработчик открывает модальное окно
    const handleManageUsersClick = () => {
        setShowUserManagementModal(true);
    };

    if (isLoading) {
        return <p className="text-center text-gray-500 dark:text-gray-300 p-10">Loading admin statistics...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200 p-4 rounded-md mx-auto max-w-md">{error}</p>;
    }

    if (!stats) {
        return <p className="text-center text-gray-500 dark:text-gray-300 p-10">No statistics data available or failed to load correctly.</p>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white text-center sm:text-left mb-4 sm:mb-0">
                    Admin Dashboard
                </h1>
                <button
                    onClick={handleManageUsersClick} // Открывает модальное окно
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition flex items-center space-x-2"
                >
                    <FontAwesomeIcon icon={faUsersCog} />
                    <span>Manage Users</span>
                </button>
            </div>

            {/* User Statistics Section */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">User Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Registered Users" value={stats.users?.total || 0} icon={faUsers} />
                    <StatCard title="New Users (Last 7 Days)" value={stats.users?.newLast7Days || 0} icon={faUserPlus} iconColor="text-green-500 dark:text-green-400" />
                    <StatCard title="New Users (Last 30 Days)" value={stats.users?.newLast30Days || 0} icon={faUserPlus} iconColor="text-green-500 dark:text-green-400" />
                </div>
            </section>

            {/* Content Statistics Section */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">Content Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Products"
                        value={stats.content?.products?.total || 0}
                        subValue={`Public: ${stats.content?.products?.public_count || 0}, Private: ${stats.content?.products?.private_count || 0}`}
                        icon={faBoxOpen}
                    />
                    <StatCard
                        title="Total Recipes"
                        value={stats.content?.recipes?.total || 0}
                        subValue={`Public: ${stats.content?.recipes?.public_count || 0}, Private: ${stats.content?.recipes?.private_count || 0}`}
                        icon={faRecipe}
                    />
                    <StatCard
                        title="Total Exercise Definitions"
                        value={stats.content?.exerciseDefinitions?.total || 0}
                        subValue={`Public: ${stats.content?.exerciseDefinitions?.public_count || 0}, Private: ${stats.content?.exerciseDefinitions?.private_count || 0}`}
                        icon={faDumbbell}
                    />
                </div>
            </section>

            {/* User Activity Section */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">User Engagement</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Users Logged Food Today" value={stats.activity?.usersLoggedFoodToday || 0} icon={faClipboardList} />
                    <StatCard title="Users Logged Activity Today" value={stats.activity?.usersLoggedActivityToday || 0} icon={faFire} />
                    <StatCard title="Meal Items Logged (Last 7 Days)" value={stats.activity?.mealProductsLast7Days || 0} icon={faChartLine} />
                    <StatCard title="Activities Logged (Last 7 Days)" value={stats.activity?.physicalActivitiesLast7Days || 0} icon={faChartLine} iconColor="text-teal-500 dark:text-teal-400"/>
                </div>
            </section>

            {/* Platform Average Nutrition Section */}
            {stats.platformAverageNutrition && (
                <section className="mb-10">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-0">
                            Platform Average Nutrition
                        </h2>
                        <div className="flex items-center space-x-2">
                            <label htmlFor="avgNutriPeriodSelect" className="text-sm font-medium text-gray-600 dark:text-gray-300">Period:</label>
                            <select
                                id="avgNutriPeriodSelect"
                                name="avgNutriPeriodSelect"
                                value={selectedPeriodDays}
                                onChange={handlePeriodChange}
                                className="border border-gray-300 rounded-md p-1.5 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="180">Last 180 Days</option>
                                <option value="365">Last 365 Days</option>
                            </select>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Averages based on {stats.platformAverageNutrition.numberOfUserDaysLogged || 0} user-days with logged food data for the selected period.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Avg. Daily KCal Consumed"
                            value={stats.platformAverageNutrition.avgDailyKcalConsumed || 0}
                            subValue="kcal / user-day"
                            icon={faAppleAlt}
                            iconColor="text-red-500 dark:text-red-400"
                        />
                        <StatCard
                            title="Avg. Daily Protein"
                            value={stats.platformAverageNutrition.avgDailyProteinGrams || 0}
                            subValue="grams / user-day"
                            icon={faDrumstickBite}
                            iconColor="text-sky-500 dark:text-sky-400"
                        />
                        <StatCard
                            title="Avg. Daily Fat"
                            value={stats.platformAverageNutrition.avgDailyFatGrams || 0}
                            subValue="grams / user-day"
                            icon={faBacon}
                            iconColor="text-amber-500 dark:text-amber-400"
                        />
                        <StatCard
                            title="Avg. Daily Carbs"
                            value={stats.platformAverageNutrition.avgDailyCarbsGrams || 0}
                            subValue="grams / user-day"
                            icon={faBreadSlice}
                            iconColor="text-orange-500 dark:text-orange-400"
                        />
                    </div>
                </section>
            )}

            {/* Render User Management Modal conditionally */}
            {showUserManagementModal && (
                <AdminUserManagementModal
                    isOpen={showUserManagementModal} // Pass isOpen prop to control visibility from inside too
                    onClose={() => setShowUserManagementModal(false)}
                />
            )}
        </div>
    );
}
// client/src/pages/AdminStatisticsPage.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers, faUserPlus, faBoxOpen, faUtensils as faRecipeIcon, // Renamed to avoid conflict
    faDumbbell, faClipboardList, faFireAlt, // Using faFireAlt for variety
    faChartBar, faUsersCog
} from '@fortawesome/free-solid-svg-icons';
import AdminUserManagementModal from '../components/AdminUserManagementModal'; // Ensure this path is correct

/**
 * StatCard component for displaying a statistic with an icon and optional button behavior
 * @param {string} title - Title of the statistic
 * @param {string|number} value - Main value to display
 * @param {string} subValue - Subtext or additional info
 * @param {object} icon - FontAwesome icon
 * @param {string} iconColor - Tailwind color class for icon
 * @param {string} bgColor - Tailwind color class for background
 * @param {function} onClick - Click handler if card is a button
 * @param {boolean} isButton - Whether the card is clickable
 * @param {string} testId - Test id for testing
 */
const StatCard = ({ title, value, subValue, icon, iconColor = 'text-indigo-500 dark:text-indigo-400', bgColor = 'bg-white dark:bg-gray-800', onClick, isButton = false, testId = "" }) => {
    const cardClasses = `${bgColor} p-6 rounded-xl shadow-lg flex items-start space-x-4`;
    const buttonClasses = isButton ? 'w-full text-left hover:ring-2 hover:ring-offset-2 hover:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all' : '';

    const content = (
        <>
            {icon && (
                <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconColor.replace('text-', 'bg-').replace('-500', '-100').replace('-400', '-800')} bg-opacity-20 dark:bg-opacity-30`}>
                    <FontAwesomeIcon icon={icon} className={`h-6 w-6 ${iconColor}`} />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <h3
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                    title={title} // Tooltip for truncated title
                >
                    {title}
                </h3>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
                {subValue && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" title={subValue}>{subValue}</p>}
            </div>
        </>
    );

    if (isButton && onClick) {
        return (
            <button onClick={onClick} className={`${cardClasses} ${buttonClasses}`} data-testid={testId}>
                {content}
            </button>
        );
    }

    return (
        <div className={`${cardClasses} ${buttonClasses}`} data-testid={testId}>
            {content}
        </div>
    );
};

/**
 * AdminStatisticsPage component for displaying admin-level statistics and user management
 */
export default function AdminStatisticsPage() {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Date range state for filtering relevant stats
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(new Date().getDate() - 6); // Today and previous 6 days = 7 days total

    const [filterStartDate, setFilterStartDate] = useState(sevenDaysAgo.toISOString().slice(0, 10));
    const [filterEndDate, setFilterEndDate] = useState(today);

    const [showUserManagementModal, setShowUserManagementModal] = useState(false);

    /**
     * Fetches admin statistics from the server for the selected date range
     */
    useEffect(() => {
        if (token) {
            setIsLoading(true);
            setError(null);
            const authHeader = { Authorization: `Bearer ${token}` };

            axios.get('/api/admin/statistics', {
                headers: authHeader,
                // Pass date range for stats that are period-dependent
                params: {
                    startDate: filterStartDate,
                    endDate: filterEndDate
                }
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
    }, [token, filterStartDate, filterEndDate]);

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
            {/* Date Range Picker for relevant stats */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Statistics for Period:</span>
                <div className="flex items-center gap-2">
                    <label htmlFor="startDateAdmin" className="text-xs text-gray-600 dark:text-gray-300">From:</label>
                    <input
                        type="date"
                        id="startDateAdmin"
                        name="startDateAdmin"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="endDateAdmin" className="text-xs text-gray-600 dark:text-gray-300">To:</label>
                    <input
                        type="date"
                        id="endDateAdmin"
                        name="endDateAdmin"
                        value={filterEndDate}
                        max={today}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                </div>
            </div>

            {/* Content Overview Section (Now First) */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">Content Overview <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Total Counts)</span></h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Products"
                        value={stats.content?.products?.total || 0}
                        subValue={`Public: ${stats.content?.products?.public_count || 0}, Private: ${stats.content?.products?.private_count || 0}`}
                        icon={faBoxOpen}
                        onClick={() => navigate('/products')}
                        isButton={true}
                    />
                    <StatCard
                        title="Total Recipes"
                        value={stats.content?.recipes?.total || 0}
                        subValue={`Public: ${stats.content?.recipes?.public_count || 0}, Private: ${stats.content?.recipes?.private_count || 0}`}
                        icon={faRecipeIcon}
                        onClick={() => navigate('/my-recipes')}
                        isButton={true}
                    />
                    <StatCard
                        title="Total Exercise Definitions"
                        value={stats.content?.exerciseDefinitions?.total || 0}
                        subValue={`Public: ${stats.content?.exerciseDefinitions?.public_count || 0}, Private: ${stats.content?.exerciseDefinitions?.private_count || 0}`}
                        icon={faDumbbell}
                        onClick={() => navigate('/exercises')}
                        isButton={true}
                    />
                </div>
            </section>

            {/* User Statistics Section */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">
                    User Stats
                    {stats.period && <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> (New users in period: {stats.period.startDate} to {stats.period.endDate})</span>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Registered Users"
                        value={stats.users?.total || 0}
                        icon={faUsers}
                        onClick={() => setShowUserManagementModal(true)} // Opens modal
                        isButton={true}
                        testId="manage-users-button"
                    />
                    <StatCard title={`New Users (Selected Period)`} value={stats.users?.newInPeriod || 0} icon={faUserPlus} iconColor="text-green-500 dark:text-green-400" />
                    {/* Static "New Users (Last 7/30 Days)" can be removed if period selector covers this */}
                </div>
            </section>

            {/* User Activity Section */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">
                    User Engagement
                    {stats.period && <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> (Period: {stats.period.startDate} to {stats.period.endDate})</span>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Unique Users Logged Food" value={stats.activity?.usersLoggedFoodInPeriod || 0} subValue="in selected period" icon={faClipboardList}/>
                    <StatCard title="Unique Users Logged Activity" value={stats.activity?.usersLoggedActivityInPeriod || 0} subValue="in selected period" icon={faFireAlt}/>
                    <StatCard title="Total Meal Items Logged" value={stats.activity?.mealProductsInPeriod || 0} subValue="in selected period" icon={faChartBar}/>
                    <StatCard title="Total Activities Logged" value={stats.activity?.physicalActivitiesInPeriod || 0} subValue="in selected period" icon={faChartBar} iconColor="text-teal-500 dark:text-teal-400"/>
                </div>
            </section>

            {/* Platform Average Nutrition Section - REMOVED as per request */}

            {/* User Management Modal */}
            {showUserManagementModal && (
                <AdminUserManagementModal
                    isOpen={showUserManagementModal}
                    onClose={() => setShowUserManagementModal(false)}
                    // Optional: pass a callback to refresh stats if a user is deleted/changed, though not critical for this modal
                />
            )}
        </div>
    );
}
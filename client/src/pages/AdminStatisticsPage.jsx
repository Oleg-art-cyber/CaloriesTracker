import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers, faUserPlus, faBoxOpen,
    faUtensils as faRecipeIcon, faDumbbell,
    faClipboardList, faFireAlt, faChartBar
} from '@fortawesome/free-solid-svg-icons';
import AdminUserManagementModal from '../components/AdminUserManagementModal';
import NewUsersModal from '../components/NewUsersModal';

const StatCard = ({
    title,
    value,
    subValue,
    icon,
    iconColor = 'text-indigo-500',
    bgColor = 'bg-white',
    onClick,
    isButton = false,
    testId = ""
}) => {
    const cardClasses = `${bgColor} p-6 rounded-xl shadow-lg flex items-start space-x-4`;
    const buttonClasses = isButton
        ? 'w-full text-left hover:ring-2 hover:ring-offset-2 hover:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all'
        : '';

    const content = (
        <>
            {icon && (
                <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconColor.replace('text-', 'bg-').replace('-500', '-100')} bg-opacity-20`}>
                    <FontAwesomeIcon icon={icon} className={`h-6 w-6 ${iconColor}`} />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-500 truncate" title={title}>
                    {title}
                </h3>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
                {subValue && <p className="text-xs text-gray-500 mt-1" title={subValue}>{subValue}</p>}
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

export default function AdminStatisticsPage() {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(new Date().getDate() - 6);

    const [filterStartDate, setFilterStartDate] = useState(sevenDaysAgo.toISOString().slice(0, 10));
    const [filterEndDate, setFilterEndDate] = useState(today);

    const [showUserManagementModal, setShowUserManagementModal] = useState(false);
    const [showNewUsersModal, setShowNewUsersModal] = useState(false);

    useEffect(() => {
        if (token) {
            setIsLoading(true);
            setError(null);
            const authHeader = { Authorization: `Bearer ${token}` };

            axios.get('/api/admin/statistics', {
                headers: authHeader,
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
        return <p className="text-center text-gray-500 p-10">Loading admin statistics...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500 bg-red-100 p-4 rounded-md mx-auto max-w-md">{error}</p>;
    }

    if (!stats) {
        return <p className="text-center text-gray-500 p-10">No statistics data available or failed to load correctly.</p>;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold text-center text-gray-800">Admin Statistics</h1>

            {/* Date range selection */}
            <div className="flex flex-wrap justify-center gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date:</label>
                    <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        max={filterEndDate}
                        className="border p-2 rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">End Date:</label>
                    <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        min={filterStartDate}
                        max={today}
                        className="border p-2 rounded"
                    />
                </div>
            </div>

            {/* Content Overview */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Content Overview <span className="text-sm font-normal text-gray-500">(Total Counts)</span></h2>
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

            {/* User Statistics */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                    User Stats
                    {stats.period && (
                        <span className="text-sm font-normal text-gray-500">
                            {' '}({stats.period.startDate} to {stats.period.endDate})
                        </span>
                    )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Registered Users"
                        value={stats.users?.total || 0}
                        icon={faUsers}
                        onClick={() => setShowUserManagementModal(true)}
                        isButton={true}
                        testId="manage-users-button"
                    />
                    <StatCard
                        title="New Users (Selected Period)"
                        value={stats.users?.newInPeriod || 0}
                        icon={faUserPlus}
                        iconColor="text-green-500"
                        onClick={() => setShowNewUsersModal(true)}
                        isButton={true}
                        testId="new-users-button"
                    />
                </div>
            </section>

            {/* User Engagement */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                    User Engagement
                    {stats.period && (
                        <span className="text-sm font-normal text-gray-500">
                            {' '}({stats.period.startDate} to {stats.period.endDate})
                        </span>
                    )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Unique Users Logged Food"
                        value={stats.activity?.usersLoggedFoodInPeriod || 0}
                        subValue="in selected period"
                        icon={faClipboardList}
                    />
                    <StatCard
                        title="Unique Users Logged Activity"
                        value={stats.activity?.usersLoggedActivityInPeriod || 0}
                        subValue="in selected period"
                        icon={faFireAlt}
                    />
                    <StatCard
                        title="Total Meal Items Logged"
                        value={stats.activity?.mealProductsInPeriod || 0}
                        subValue="in selected period"
                        icon={faChartBar}
                    />
                    <StatCard
                        title="Total Activities Logged"
                        value={stats.activity?.physicalActivitiesInPeriod || 0}
                        subValue="in selected period"
                        icon={faChartBar}
                        iconColor="text-teal-500"
                    />
                </div>
            </section>

            {/* Modals */}
            {showUserManagementModal && (
                <AdminUserManagementModal
                    isOpen={showUserManagementModal}
                    onClose={() => setShowUserManagementModal(false)}
                />
            )}
            {showNewUsersModal && (
                <NewUsersModal
                    isOpen={showNewUsersModal}
                    onClose={() => setShowNewUsersModal(false)}
                    startDate={filterStartDate}
                    endDate={filterEndDate}
                />
            )}
        </div>
    );
}

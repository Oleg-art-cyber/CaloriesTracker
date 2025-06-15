// client/src/pages/StatisticsPage.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import LineChartComponent from '../components/LineChartComponent';
import PieChartComponent from '../components/PieChartComponent';

// Helper function to format date for API (YYYY-MM-DD)
const formatDateForAPI = (dateObj) => dateObj.toISOString().slice(0, 10);

/**
 * Renders the user's statistics page with charts for weight, calories, and macros.
 */
export default function StatisticsPage() {
    const { token } = useContext(AuthContext);

    const [periodOption, setPeriodOption] = useState('month');
    const [error, setError] = useState(null);

    // State for each statistics section
    const [weightTrendData, setWeightTrendData] = useState(null);
    const [calorieTrendData, setCalorieTrendData] = useState(null);
    const [periodSummary, setPeriodSummary] = useState(null);
    const [macroDistribution, setMacroDistribution] = useState(null);

    // Individual loading states for better UX
    const [isLoadingWeight, setIsLoadingWeight] = useState(true);
    const [isLoadingTrend, setIsLoadingTrend] = useState(true);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [isLoadingMacros, setIsLoadingMacros] = useState(true);

    // Effect for fetching Weight and Calorie Trends (they use the same `period_days` parameter)
    useEffect(() => {
        if (!token) return;

        const authHeader = { Authorization: `Bearer ${token}` };
        const params = { period_days: periodOption === 'week' ? 7 : 30 };
        setError(null);

        // Fetch Weight Trend
        setIsLoadingWeight(true);
        axios.get('/api/statistics/weight-trend', { params, headers: authHeader })
            .then(response => {
                const data = response.data;
                if (Array.isArray(data) && data.length > 0) {
                    const labels = data.map(d => new Date(d.date + "T00:00:00").toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                    setWeightTrendData({
                        labels,
                        datasets: [{
                            label: 'Weight', data: data.map(d => d.weight), borderColor: 'rgb(153, 102, 255)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)', tension: 0.1, fill: 'origin',
                            pointRadius: 3, pointHoverRadius: 6,
                        }]
                    });
                } else { setWeightTrendData(null); }
            })
            .catch(err => { console.error("Fetch weight trend error:", err); setError("Could not load weight trend."); })
            .finally(() => setIsLoadingWeight(false));

        // Fetch Calorie Trend
        setIsLoadingTrend(true);
        axios.get('/api/statistics/calories-trend', { params, headers: authHeader })
            .then(response => {
                const data = response.data;
                if (Array.isArray(data) && data.length > 0) {
                    const labels = data.map(d => new Date(d.date + "T00:00:00").toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                    setCalorieTrendData({
                        labels,
                        datasets: [
                            { label: 'Consumed', data: data.map(d => d.consumed), borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', tension: 0.1, fill: 'origin' },
                            { label: 'Burned (Exercise)', data: data.map(d => d.burned), borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)', tension: 0.1, fill: 'origin' },
                            { label: 'Net', data: data.map(d => d.consumed - d.burned), borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', tension: 0.1, fill: false }
                        ]
                    });
                } else { setCalorieTrendData(null); }
            })
            .catch(err => { console.error("Fetch calorie trend error:", err); setError("Could not load calorie trend."); })
            .finally(() => setIsLoadingTrend(false));

    }, [token, periodOption]);

    // Effect for fetching Period Summary and Macronutrient Distribution (they use the same date range parameters)
    useEffect(() => {
        if (!token) return;

        const authHeader = { Authorization: `Bearer ${token}` };
        // Logic for calculating date range is now correctly placed inside the effect
        const today = new Date();
        let startDate, endDate = formatDateForAPI(today);
        if (periodOption === 'week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 6);
            startDate = formatDateForAPI(lastWeek);
        } else { // 'month'
            const lastMonth = new Date(today);
            lastMonth.setDate(today.getDate() - 29);
            startDate = formatDateForAPI(lastMonth);
        }
        const params = { startDate, endDate };
        setError(null);

        // Fetch Period Summary
        setIsLoadingSummary(true);
        axios.get('/api/statistics/period-summary', { params, headers: authHeader })
            .then(response => {
                setPeriodSummary(response.data);
            })
            .catch(err => { console.error("Fetch period summary error:", err); setError("Could not load period summary."); })
            .finally(() => setIsLoadingSummary(false));

        // Fetch Macronutrient Distribution
        setIsLoadingMacros(true);
        axios.get('/api/statistics/macronutrient-distribution', { params, headers: authHeader })
            .then(response => {
                const data = response.data;
                if (data && typeof data.protein_pct === 'number' && data.protein_pct > 0) {
                    setMacroDistribution({
                        labels: ['Protein', 'Fat', 'Carbs'],
                        datasets: [{
                            label: 'Macronutrient Distribution (%)',
                            data: [data.protein_pct, data.fat_pct, data.carbs_pct],
                            backgroundColor: ['rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(255, 99, 132, 0.7)'],
                        }]
                    });
                } else { setMacroDistribution(null); }
            })
            .catch(err => { console.error("Fetch macro distribution error:", err); setError("Could not load macro distribution."); })
            .finally(() => setIsLoadingMacros(false));

    }, [token, periodOption]);

    const isLoading = isLoadingWeight || isLoadingTrend || isLoadingSummary || isLoadingMacros;

    // Chart.js options
    const chartOptions = (title) => ({
        responsive: true,
        plugins: {
            title: { display: true, text: `${title} - Last ${periodOption === 'week' ? '7' : '30'} Days` }
        }
    });

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">My Statistics</h1>

            <div className="mb-6 flex items-center justify-center space-x-2">
                <label htmlFor="periodSelectStats" className="text-sm font-medium text-gray-700 dark:text-gray-300">View data for:</label>
                <select
                    id="periodSelectStats"
                    value={periodOption}
                    onChange={(e) => setPeriodOption(e.target.value)}
                    className="border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                </select>
            </div>

            {isLoading && <p className="text-center text-gray-500 py-10">Loading statistics...</p>}
            {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

            {!isLoading && !error && (
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                        {weightTrendData ?
                            <LineChartComponent chartData={weightTrendData} chartOptions={chartOptions('Weight Trend')} /> :
                            <p className="text-center text-gray-500 py-10">No weight data available for this period.</p>
                        }
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                            {calorieTrendData ?
                                <LineChartComponent chartData={calorieTrendData} chartOptions={chartOptions('Calorie & Activity Trend')} /> :
                                <p className="text-center text-gray-500 py-10">No calorie data available for this period.</p>
                            }
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                            {macroDistribution ?
                                <PieChartComponent chartData={macroDistribution} chartOptions={chartOptions('Macronutrient Distribution')} /> :
                                <p className="text-center text-gray-500 py-10">No macronutrient data available for this period.</p>
                            }
                        </div>
                    </div>
                </div>
            )}

            {!isLoadingSummary && !error && periodSummary && (
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg mt-8">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 text-center">
                        Summary for {periodSummary.period.startDate} to {periodSummary.period.endDate}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                        {[
                            { label: "Avg Daily Calories", value: periodSummary.avg_daily_kcal_consumed, unit: "kcal" },
                            { label: "Avg Daily Protein", value: periodSummary.avg_daily_protein, unit: "g" },
                            { label: "Avg Daily Fat", value: periodSummary.avg_daily_fat, unit: "g" },
                            { label: "Avg Daily Carbs", value: periodSummary.avg_daily_carbs, unit: "g" },
                            { label: "Total Exercise Burn", value: periodSummary.total_kcal_burned_exercise, unit: "kcal" },
                            { label: "Avg Daily Exercise Burn", value: periodSummary.avg_daily_kcal_burned_exercise, unit: "kcal" },
                            { label: "Days Food Logged", value: `${periodSummary.days_with_food_log} / ${periodSummary.period.days}` },
                            { label: "Days Activity Logged", value: `${periodSummary.days_with_activity_log} / ${periodSummary.period.days}` },
                        ].map(stat => (
                            <div key={stat.label} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                                <p className="font-medium text-gray-600 dark:text-gray-200">{stat.label}</p>
                                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{stat.value} {stat.unit || ''}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
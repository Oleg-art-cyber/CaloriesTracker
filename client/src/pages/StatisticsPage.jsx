import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import LineChartComponent from '../components/LineChartComponent';
import PieChartComponent from '../components/PieChartComponent';

/**
 * Formats JS Date object to YYYY-MM-DD string
 * @param {Date} dateObj - JavaScript Date object
 * @returns {string} Formatted date string
 */
const formatDateForAPI = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formats date string for display
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string for display
 */
const formatDateForDisplay = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * StatisticsPage component for displaying user statistics and nutrition trends
 * Allows users to select custom date range and view nutrition trends
 */
export default function StatisticsPage() {
    const { token } = useContext(AuthContext);

    // Initialize dates properly
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 6);
    
    const [startDate, setStartDate] = useState(formatDateForAPI(sixDaysAgo));
    const [endDate, setEndDate] = useState(formatDateForAPI(today));

    const [error, setError] = useState(null);

    const [weightTrendData, setWeightTrendData] = useState(null);
    const [calorieTrendData, setCalorieTrendData] = useState(null);
    const [periodSummary, setPeriodSummary] = useState(null);
    const [macroDistribution, setMacroDistribution] = useState(null);

    const [isLoadingWeight, setIsLoadingWeight] = useState(true);
    const [isLoadingTrend, setIsLoadingTrend] = useState(true);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [isLoadingMacros, setIsLoadingMacros] = useState(true);

    /**
     * Validates and updates date range
     * @param {string} type - 'start' or 'end'
     * @param {string} value - New date value
     */
    const handleDateChange = (type, value) => {
        const newDate = new Date(value);
        newDate.setHours(0, 0, 0, 0); // Set to start of day
        
        const currentStart = new Date(startDate);
        currentStart.setHours(0, 0, 0, 0);
        
        const currentEnd = new Date(endDate);
        currentEnd.setHours(0, 0, 0, 0);
        
        if (type === 'start') {
            if (newDate > currentEnd) {
                setError("Start date cannot be after end date");
                return;
            }
            setStartDate(value);
        } else {
            if (newDate < currentStart) {
                setError("End date cannot be before start date");
                return;
            }
            setEndDate(value);
        }
        setError(null);
    };

    // Fetches weight and calorie trend charts
    useEffect(() => {
        if (!token || !startDate || !endDate) return;

        const authHeader = { Authorization: `Bearer ${token}` };
        const params = { startDate, endDate };
        setError(null);

        // Weight trend
        setIsLoadingWeight(true);
        axios.get('/api/statistics/weight-trend', { params, headers: authHeader })
            .then(response => {
                // No need to fill missing dates for weight, as backend interpolates
                const data = response.data;
                if (Array.isArray(data) && data.length > 0) {
                    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
                    const labels = sortedData.map(d => formatDateForDisplay(d.date));
                    setWeightTrendData({
                        labels,
                        datasets: [{
                            label: 'Weight (kg)',
                            data: sortedData.map(d => d.weight),
                            borderColor: 'rgb(153, 102, 255)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            tension: 0.1,
                            fill: 'origin',
                            pointRadius: 3,
                            pointHoverRadius: 6,
                        }]
                    });
                } else {
                    setWeightTrendData(null);
                }
            })
            .catch(err => {
                console.error("Weight trend error:", err);
                setError("Failed to load weight trend.");
            })
            .finally(() => setIsLoadingWeight(false));

        // Calorie trend
        setIsLoadingTrend(true);
        axios.get('/api/statistics/calories-trend', { params, headers: authHeader })
            .then(response => {
                // Ensure all days in the range are represented, even if no data for some days
                const data = response.data;
                const allDates = [];
                let current = new Date(startDate);
                const end = new Date(endDate);
                while (current <= end) {
                    allDates.push(formatDateForAPI(current));
                    current.setDate(current.getDate() + 1);
                }
                // Log all dates expected on the chart
                console.log('allDates:', allDates);
                // Normalize all server dates to YYYY-MM-DD for reliable matching
                const dataMap = new Map(
                  Array.isArray(data)
                    ? data.map(d => [d.date.slice(0, 10), d]) // slice(0, 10) ensures only date part
                    : []
                );
                // Log all keys from server data
                console.log('dataMap keys:', Array.from(dataMap.keys()));
                // Log today and endDate for debugging
                console.log('today:', formatDateForAPI(new Date()));
                console.log('endDate:', endDate);
                // Fill missing days with zeros
                const filledData = allDates.map(date => dataMap.get(date) || { date, consumed: 0, burned: 0 });
                const labels = filledData.map(d => formatDateForDisplay(d.date));
                setCalorieTrendData({
                    labels,
                    datasets: [
                        {
                            label: 'Consumed',
                            data: filledData.map(d => d.consumed),
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.1,
                            fill: 'origin'
                        },
                        {
                            label: 'Burned',
                            data: filledData.map(d => d.burned),
                            borderColor: 'rgb(54, 162, 235)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            tension: 0.1,
                            fill: 'origin'
                        },
                        {
                            label: 'Net',
                            data: filledData.map(d => d.consumed - d.burned),
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1,
                            fill: false
                        }
                    ]
                });
            })
            .catch(err => {
                console.error("Calorie trend error:", err);
                setError("Failed to load calorie trend.");
            })
            .finally(() => setIsLoadingTrend(false));

    }, [token, startDate, endDate]);

    // Fetches period summary and macro split
    useEffect(() => {
        if (!token || !startDate || !endDate) return;
        const authHeader = { Authorization: `Bearer ${token}` };
        const params = { startDate, endDate };
        setError(null);

        setIsLoadingSummary(true);
        axios.get('/api/statistics/period-summary', { params, headers: authHeader })
            .then(response => setPeriodSummary(response.data))
            .catch(err => {
                console.error("Period summary error:", err);
                setError("Failed to load period summary.");
            })
            .finally(() => setIsLoadingSummary(false));

        setIsLoadingMacros(true);
        axios.get('/api/statistics/macronutrient-distribution', { params, headers: authHeader })
            .then(response => {
                // Ensure all days in the range are represented for macros as well
                const data = response.data;
                if (data && typeof data.protein_pct === 'number') {
                    setMacroDistribution({
                        labels: ['Protein', 'Fat', 'Carbs'],
                        datasets: [{
                            label: 'Macronutrient %',
                            data: [data.protein_pct, data.fat_pct, data.carbs_pct],
                            backgroundColor: [
                                'rgba(54, 162, 235, 0.7)',
                                'rgba(255, 206, 86, 0.7)',
                                'rgba(255, 99, 132, 0.7)'
                            ],
                        }]
                    });
                } else {
                    setMacroDistribution(null);
                }
            })
            .catch(err => {
                console.error("Macro distribution error:", err);
                setError("Failed to load macro distribution.");
            })
            .finally(() => setIsLoadingMacros(false));

    }, [token, startDate, endDate]);

    const isLoading = isLoadingWeight || isLoadingTrend || isLoadingSummary || isLoadingMacros;

    const chartOptions = (title) => ({
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: `${title} (${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)})`
            }
        },
        scales: {
            y: {
                title: {
                    display: true,
                    text: title === 'Weight Trend' ? 'Weight (kg)' : 'Calories'
                }
            }
        }
    });

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold text-center text-gray-800">My Statistics</h1>

            {/* Date range selection */}
            <div className="flex flex-wrap justify-center gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleDateChange('start', e.target.value)}
                        max={endDate}
                        className="border p-2 rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">End Date:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleDateChange('end', e.target.value)}
                        min={startDate}
                        max={formatDateForAPI(new Date())}
                        className="border p-2 rounded"
                    />
                </div>
            </div>

            {isLoading && <p className="text-center text-gray-500">Loading statistics...</p>}
            {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded">{error}</p>}

            {!isLoading && !error && (
                <div className="space-y-8">
                    <div className="bg-white p-4 rounded shadow">
                        {weightTrendData ?
                            <LineChartComponent chartData={weightTrendData} chartOptions={chartOptions('Weight Trend')} /> :
                            <p className="text-center text-gray-500">No weight data for selected dates.</p>
                        }
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded shadow">
                            {calorieTrendData ?
                                <LineChartComponent chartData={calorieTrendData} chartOptions={chartOptions('Calories & Burn')} /> :
                                <p className="text-center text-gray-500">No calorie data for selected dates.</p>
                            }
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            {macroDistribution ?
                                <PieChartComponent chartData={macroDistribution} chartOptions={chartOptions('Macros')} /> :
                                <p className="text-center text-gray-500">No macro data for selected dates.</p>
                            }
                        </div>
                    </div>
                </div>
            )}

            {!isLoadingSummary && !error && periodSummary && (
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-xl font-semibold text-center text-gray-800">
                        Summary: {formatDateForDisplay(periodSummary.period.startDate)} → {formatDateForDisplay(periodSummary.period.endDate)}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                        {[ // Summary stats block
                            { label: 'Avg Calories', value: periodSummary.avg_daily_kcal_consumed, unit: 'kcal' },
                            { label: 'Protein', value: periodSummary.avg_daily_protein, unit: 'g' },
                            { label: 'Fat', value: periodSummary.avg_daily_fat, unit: 'g' },
                            { label: 'Carbs', value: periodSummary.avg_daily_carbs, unit: 'g' },
                            { label: 'Total Burned', value: periodSummary.total_kcal_burned_exercise, unit: 'kcal' },
                            { label: 'Avg Burned', value: periodSummary.avg_daily_kcal_burned_exercise, unit: 'kcal' },
                            { label: 'Food Log Days', value: `${periodSummary.days_with_food_log} / ${periodSummary.period.days}` },
                            { label: 'Activity Days', value: `${periodSummary.days_with_activity_log} / ${periodSummary.period.days}` },
                        ].map(item => (
                            <div key={item.label} className="bg-gray-100 p-3 rounded text-center">
                                <div className="text-sm text-gray-600">{item.label}</div>
                                <div className="text-lg font-semibold text-gray-800">
                                    {item.value}{item.unit ? ` ${item.unit}` : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

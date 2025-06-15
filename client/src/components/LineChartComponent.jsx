// client/src/components/LineChartComponent.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler // For filling area under the line
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function LineChartComponent({ chartData, chartOptions }) {
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false, // Important for controlling height via wrapper
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Chart Title (can be passed via props)',
                font: {
                    size: 16
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Date'
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Calories (kcal)'
                },
                beginAtZero: true
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    const options = { ...defaultOptions, ...chartOptions }; // Merge default with custom options

    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
        return <p className="text-center text-gray-500">No data available to display chart.</p>;
    }

    return (
        <div className="relative h-64 md:h-96"> {/* Control chart size via this wrapper */}
            <Line options={options} data={chartData} />
        </div>
    );
}
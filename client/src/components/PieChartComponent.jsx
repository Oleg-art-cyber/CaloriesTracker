// client/src/components/PieChartComponent.jsx
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function PieChartComponent({ chartData, chartOptions }) {
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Chart Title (Set via props)', // Default title
                font: { size: 16 }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            // Assuming chartData.datasets[0].data contains percentages
                            // and raw value might be grams if passed in meta
                            const rawValue = context.dataset.metaData?.[context.dataIndex]?.grams;
                            if (rawValue !== undefined) {
                                label += `${rawValue.toFixed(1)}g (${context.formattedValue}%)`;
                            } else {
                                label += `${context.formattedValue}%`;
                            }
                        }
                        return label;
                    }
                }
            }
        },
    };
    const options = { ...defaultOptions, ...chartOptions }; // Merge default with custom options

    if (!chartData || !chartData.labels || chartData.labels.length === 0 || !chartData.datasets || chartData.datasets.length === 0 || chartData.datasets[0].data.length === 0) {
        return <p className="text-center text-gray-500 py-4">No data available for pie chart.</p>;
    }
    return (
        <div className="relative h-72 md:h-80"> {/* Adjust height as needed */}
            <Pie data={chartData} options={options} />
        </div>
    );
}
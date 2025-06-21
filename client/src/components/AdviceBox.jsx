// client/src/components/AdviceBox.jsx
import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

/**
 * Calculates target calories based on user profile data using the Mifflin-St Jeor equation
 * @param {Object} profile - User profile containing weight, height, age, gender, activity_level, and goal
 * @returns {number} Target calorie goal
 */
const calculateTargetCalories = (profile) => {
    if (!profile || !profile.weight || !profile.height || !profile.age) {
        // console.warn("AdviceBox: Profile data incomplete for calorie calculation, using default 2000kcal.");
        return 2000;
    }
    // Simplified Mifflin-St Jeor
    let bmr = (10 * parseFloat(profile.weight)) +
        (6.25 * parseFloat(profile.height)) -
        (5 * parseInt(profile.age));
    bmr += (profile.gender === 'male' ? 5 : (profile.gender === 'female' ? -161 : -78));

    const activityMultipliers = {
        sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
    };
    const tdee = bmr * (activityMultipliers[profile.activity_level] || 1.375); // Default to light if not specified

    if (profile.goal === 'lose') return tdee - 500;
    if (profile.goal === 'gain') return tdee + 300; // Smaller surplus for cleaner gain
    return tdee; // maintain
};

const MAX_INITIALLY_VISIBLE_ADVICE = 2;
const MAX_TOTAL_VISIBLE_ADVICE = 6;

export default function AdviceBox({ userProfile, diaryData }) {
    const [adviceList, setAdviceList] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userProfile || !userProfile.id || !diaryData || !diaryData.summary || !diaryData.meals) {
            setAdviceList([]);
            return;
        }
        setLoading(true);
        setError(null);
        axios.post('/api/advice', {
            profile: userProfile,
            diary: diaryData
        })
        .then(res => setAdviceList(res.data))
        .catch(err => {
            setError('Ошибка загрузки советов');
            setAdviceList([]);
        })
        .finally(() => setLoading(false));
    }, [userProfile, diaryData]);

    const getAdviceStyleInternal = (type) => {
        switch (type) {
            case 'warning': return { emoji: '⚠️', color: 'text-red-700', bg: 'bg-red-50 border-red-300' };
            case 'suggestion': return { emoji: '💡', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-300' };
            case 'praise': return { emoji: '🎉', color: 'text-green-700', bg: 'bg-green-50 border-green-300' };
            case 'info':
            default: return { emoji: 'ℹ️', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-300' };
        }
    };
    const настроение_иконок = {
        'warning': 'animate-pulse',
        'suggestion': '',
        'praise': 'animate-bounce-short',
        'info': ''
    };

    if (loading) return <div>Загрузка советов...</div>;
    if (error) return <div className="text-red-600">{error}</div>;
    if (!adviceList.length) {
        const style = getAdviceStyleInternal('info');
        return (
            <div className={`p-4 rounded-xl shadow-sm border ${style.bg} ${style.border}`}>
                <div className="flex items-start">
                    <span className="text-2xl mr-3 pt-1">{style.emoji}</span>
                    <div>
                        <h3 className={`text-md font-semibold ${style.color} mb-1`}>Tip of the day:</h3>
                        <p className={`text-sm ${style.color.replace('700', '900')}`}>Keep tracking consistently to get personalized advice! Ensure your profile (weight, height, age, goal, gender, activity level) is up to date.</p>
                    </div>
                </div>
            </div>
        );
    }

    const visibleAdvice = showAll
        ? adviceList.slice(0, MAX_TOTAL_VISIBLE_ADVICE)
        : adviceList.slice(0, MAX_INITIALLY_VISIBLE_ADVICE);

    return (
        <div className="space-y-3">
            {visibleAdvice.map((advice) => {
                const style = getAdviceStyleInternal(advice.type);
                return (
                    <div key={advice.id} className={`p-4 rounded-xl shadow-sm border ${style.bg} ${style.border}`}>
                        <div className="flex items-start">
                            <span className={`text-2xl mr-3 pt-0.5 ${настроение_иконок[advice.type] || ''}`}>{style.emoji}</span>
                            <div>
                                <h3 className={`text-md font-semibold ${style.color} mb-1`}>
                                    {advice.type.charAt(0).toUpperCase() + advice.type.slice(1)}:
                                </h3>
                                <p className={`text-sm ${style.color.replace('700', '900').replace('bg-opacity-75', '')}`}>{advice.text}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
            {adviceList.length > MAX_INITIALLY_VISIBLE_ADVICE && !showAll && (
                <button
                    onClick={() => setShowAll(true)}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium py-2 px-3 rounded-md border border-blue-200 hover:bg-blue-50 transition"
                >
                    Show {Math.min(MAX_TOTAL_VISIBLE_ADVICE, adviceList.length) - MAX_INITIALLY_VISIBLE_ADVICE} more tip(s)... (Total {adviceList.length} relevant tips)
                </button>
            )}
            {showAll && adviceList.length > MAX_INITIALLY_VISIBLE_ADVICE && (
                <button
                    onClick={() => setShowAll(false)}
                    className="w-full text-sm text-gray-600 hover:text-gray-800 hover:underline font-medium py-2 px-3 rounded-md border border-gray-200 hover:bg-gray-100 transition mt-2"
                >
                    Show fewer tips
                </button>
            )}
        </div>
    );
}
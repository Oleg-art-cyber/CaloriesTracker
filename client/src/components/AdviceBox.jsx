// client/src/components/AdviceBox.jsx
import React, { useState, useEffect, useMemo } from 'react';

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

// --- Advice Bank with Priority and Type ---
// Priority: 1 (High/Critical), 2 (Medium/Important), 3 (Low/General Tip)
// Type: 'warning', 'suggestion', 'info', 'praise'
// text can be a string or a function (name, param1, param2, ...) => "string"
// condition: (profileData, diaryData) => boolean
// calcParams: (profileData, diaryData) => [param1, param2, ...] (optional, for dynamic text)
const ADVICE_BANK = [
    // Calories - Priority 1 (Warnings)
    {
        id: 'c1', priority: 1, type: 'warning',
        text: (name, diff) => `${name}, you've significantly exceeded your calorie target by ~${Math.abs(diff)} kcal. Consistent overeating can hinder your goals.`,
        condition: (p, d) => p.goal && d.summary.net_kcal > (calculateTargetCalories(p) + 500),
        calcParams: (p, d) => [p.name, Math.round(d.summary.net_kcal - calculateTargetCalories(p))]
    },
    {
        id: 'c2', priority: 1, type: 'warning',
        text: (name, diff) => `${name}, you're well below your calorie target by ~${Math.abs(diff)} kcal. If your goal isn't significant weight loss, ensure you're eating enough for energy and nutrients.`,
        condition: (p, d) => p.goal !== 'lose' && d.summary.net_kcal < (calculateTargetCalories(p) - 500),
        calcParams: (p, d) => [p.name, Math.round(d.summary.net_kcal - calculateTargetCalories(p))]
    },
    {
        id: 'c3', priority: 1, type: 'warning',
        text: (name, diff) => `For weight loss, a deficit is key, but being ~${Math.abs(diff)} kcal below target, ${name}, might be too restrictive. Focus on sustainable habits.`,
        condition: (p, d) => p.goal === 'lose' && d.summary.net_kcal < (calculateTargetCalories(p) - 700),
        calcParams: (p, d) => [p.name, Math.round(d.summary.net_kcal - calculateTargetCalories(p))]
    },
    // Macros - Priority 1 (Warnings)
    {
        id: 'm1', priority: 1, type: 'warning',
        text: (name) => `Hey ${name}, your fat intake appears quite high today. While fats are important, balance is key. Review your food choices.`,
        condition: (p, d) => d.summary.kcal_consumed > 1200 && d.summary.fat > ((d.summary.kcal_consumed * 0.40) / 9), // If fat is >40% of calories
        calcParams: (p,d) => [p.name]
    },
    {
        id: 'm2', priority: 1, type: 'warning',
        text: (name) => `${name}, a large portion of your calories today came from carbohydrates. Ensure these are primarily complex carbs for sustained energy.`,
        condition: (p, d) => d.summary.kcal_consumed > 1200 && d.summary.carbs > ((d.summary.kcal_consumed * 0.65) / 4), // If carbs >65% of calories
        calcParams: (p,d) => [p.name]
    },
    // Macros - Priority 2 (Suggestions)
    {
        id: 'm3', priority: 2, type: 'suggestion',
        text: (name) => `Your protein intake is a bit on the lower side today, ${name}. Try incorporating more lean protein sources like chicken, fish, beans, or tofu.`,
        condition: (p, d) => p.weight && d.summary.kcal_consumed > 800 && d.summary.protein < (p.weight * 1.2), // Target ~1.2g/kg
        calcParams: (p,d) => [p.name]
    },
    {
        id: 'm4', priority: 2, type: 'praise',
        text: (name) => `Great job on hitting your protein target today, ${name}! This supports muscle health and satiety.`,
        condition: (p, d) => p.weight && d.summary.protein >= (p.weight * 1.6), // Example high protein target
        calcParams: (p,d) => [p.name]
    },
    // Activity - Priority 2
    {
        id: 'a1', priority: 2, type: 'praise',
        text: () => "Fantastic effort with your physical activity today! Every bit of movement counts.",
        condition: (p, d) => d.summary.kcal_burned_exercise >= 300
    },
    {
        id: 'a2', priority: 2, type: 'suggestion',
        text: () => "It seems like a less active day today. How about a brisk 20-minute walk to boost your energy?",
        condition: (p, d) => d.summary.kcal_burned_exercise < 100 && d.loggedActivities.length === 0
    },
    // Diet Composition - Priority 2 (Simplified conditions)
    {
        id: 'v1', priority: 2, type: 'suggestion',
        text: (name) => `Aim to include more colorful vegetables in your meals, ${name}. They're nutritional powerhouses!`,
        condition: (p, d) => !Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/vegetable|salad|broccoli|spinach|carrot|tomato/))),
        calcParams: (p,d) => [p.name]
    },
    {
        id: 'f1', priority: 2, type: 'suggestion',
        text: (name) => `A piece of fruit or a handful of berries can be a great way to add vitamins and natural sweetness, ${name}.`,
        condition: (p, d) => !Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/fruit|apple|banana|orange|berry|berries/))),
        calcParams: (p,d) => [p.name]
    },
    // Hydration & General Habits - Priority 3
    {
        id: 'h1', priority: 3, type: 'info',
        text: () => "Stay hydrated! Drinking enough water is crucial for overall health, energy, and even metabolism.",
        condition: () => Math.random() < 0.3 // Show this ~30% of the time if no higher priority advice
    },
    {
        id: 'g1', priority: 3, type: 'info',
        text: () => "Consistency is more important than perfection in your health journey. Keep up the good effort!",
        condition: () => Math.random() < 0.2
    },
    {
        id: 'g2', priority: 3, type: 'info',
        text: () => "Remember that quality sleep plays a big role in recovery, hormone balance, and appetite regulation.",
        condition: () => Math.random() < 0.2
    },
    {
        id: 'e1', priority: 2, type: 'suggestion',
        text: (name, meal) => `It appears you might have missed ${meal} today, ${name}. Regular meal timing can help manage hunger and energy.`,
        condition: (p, d) => {
            const hour = new Date().getHours();
            if (hour >= 11 && (d.meals.breakfast?.items?.length || 0) === 0) return true; // Missed breakfast by late morning
            if (hour >= 16 && (d.meals.lunch?.items?.length || 0) === 0) return true;     // Missed lunch by late afternoon
            if (hour >= 21 && (d.meals.dinner?.items?.length || 0) === 0) return true;    // Missed dinner by late evening
            return false;
        },
        calcParams: (p,d) => {
            const hour = new Date().getHours();
            let skipped = 'a meal';
            if (hour >= 11 && (d.meals.breakfast?.items?.length || 0) === 0) skipped = 'breakfast';
            else if (hour >= 16 && (d.meals.lunch?.items?.length || 0) === 0) skipped = 'lunch';
            else if (hour >= 21 && (d.meals.dinner?.items?.length || 0) === 0) skipped = 'dinner';
            return [p.name, skipped];
        }
    },
    {
        id: 'e2', priority: 2, type: 'suggestion',
        text: (name, mealType) => `Your ${mealType.toLowerCase()} was quite substantial, ${name}. If you often feel overly full, slightly smaller, more frequent meals might work better.`,
        condition: (p, d) => {
            if (d.summary.kcal_consumed < 800) return false; // Don't trigger for low total intake days
            return Object.values(d.meals).some(meal => (meal.items || []).reduce((sum, i) => sum + (i.kcal || 0), 0) > (d.summary.kcal_consumed * 0.60)); // One meal > 60% total
        },
        calcParams: (p,d) => {
            const [type] = Object.entries(d.meals).find(([type, meal]) => (meal.items || []).reduce((sum, i) => sum + (i.kcal || 0), 0) > (d.summary.kcal_consumed * 0.60)) || ['meal'];
            return [p.name, type];
        }
    },
    { id: 'e3', priority: 3, type: 'info', text: () => "Eating a large meal very late might impact sleep quality. If possible, try to have your last big meal 2-3 hours before bed.", condition: (p, d) => (d.meals.dinner?.items?.length || 0) > 0 && new Date(d.date + "T21:30:00") < new Date() && Math.random() < 0.3 },
    { id: 'p1', priority: 3, type: 'suggestion', text: () => "Diversify your protein! Consider fish, eggs, legumes, tofu, or Greek yogurt alongside meats.", condition: (p,d) => (d.summary.protein || 0) > 20 && Math.random() < 0.2 },
    { id: 'f2', priority: 3, type: 'info', text: () => "Healthy fats are vital! Avocados, nuts, seeds, and olive oil are excellent sources.", condition: () => Math.random() < 0.2 },
    { id: 'a3', priority: 2, type: 'suggestion', text: () => "Aim for consistent daily movement. Taking the stairs or a short walk during breaks adds up!", condition: (p, d) => d.summary.kcal_burned_exercise < 150 && Math.random() < 0.35 },
    { id: 'a4', priority: 3, type: 'info', text: () => "Incorporating strength training 2-3 times a week helps build muscle, which boosts your metabolism.", condition: (p, d) => (p.goal === 'lose' || p.goal === 'gain' || p.goal === 'maintain') && Math.random() < 0.15 },
    { id: 'm4', priority: 3, type: 'info', text: () => "Focus on progress, not perfection. Each healthy choice is a step in the right direction!", condition: () => Math.random() < 0.25 },
    { id: 'm5', priority: 3, type: 'info', text: () => "Practice mindful eating: slow down, savor your food, and listen to your body's hunger and fullness signals.", condition: () => Math.random() < 0.2 },
    { id: 'm6', priority: 3, type: 'suggestion', text: () => "Meal prepping or planning ahead can make healthy eating much easier during busy weeks.", condition: () => Math.random() < 0.15 },
    {
        id: 'm7', priority: 2, type: 'info',
        text: (name) => `If you had a meal that was off-plan, ${name}, don't let it derail you. Just get back to your routine with the next meal.`,
        condition: (p,d) => p.goal && d.summary.kcal_consumed > (calculateTargetCalories(p) + 700) && Math.random() < 0.4,
        calcParams: (p,d) => [p.name]
    },
    {
        id: 'gl1', priority: 2, type: 'praise',
        text: (name) => `Well done, ${name}! You're effectively managing a calorie deficit for your weight loss goal today.`,
        condition: (p, d) => p.goal === 'lose' && d.summary.net_kcal < calculateTargetCalories(p) && d.summary.net_kcal > (calculateTargetCalories(p) - 600),
        calcParams: (p,d) => [p.name]
    },
    {
        id: 'gg1', priority: 2, type: 'praise',
        text: (name) => `Great job fueling your body, ${name}! A slight calorie surplus is helpful for your muscle gain objective.`,
        condition: (p, d) => p.goal === 'gain' && d.summary.net_kcal > calculateTargetCalories(p) && d.summary.net_kcal < (calculateTargetCalories(p) + 500),
        calcParams: (p,d) => [p.name]
    },
    {
        id: 'gm1', priority: 2, type: 'praise',
        text: () => "You're doing a good job maintaining your calorie balance today!",
        condition: (p, d) => p.goal === 'maintain' && Math.abs(d.summary.net_kcal - calculateTargetCalories(p)) < 200
    },
    { id: 'e4', priority: 3, type: 'info', text: () => "Reading food labels helps you make informed choices about serving sizes and nutritional content.", condition: () => Math.random() < 0.1 },
    {
        id: 'e5', priority: 2, type: 'suggestion',
        text: () => "Cooking at home gives you more control over ingredients, portions, and overall healthiness of your meals.",
        condition: (p,d) => !Object.values(d.meals).some(meal => (meal.items || []).some(item => item.type === 'recipe')) && Math.random() < 0.25
    }, // Suggest if no recipes logged
    {
        id: 'e6', priority: 2, type: 'suggestion',
        text: () => "Try to limit highly processed foods. They often contain added sugars, unhealthy fats, and excess sodium.",
        condition: (p, d) => Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/chip|soda|candy|fast food|processed meat|sausage|hot dog/))), // Simplified check
    },
    { id: 'e7', priority: 3, type: 'info', text: () => "Aim for a balanced plate: roughly half vegetables/fruits, a quarter lean protein, and a quarter whole grains.", condition: () => Math.random() < 0.15 },
    { id: 'm8', priority: 3, type: 'info', text: () => "Small, consistent healthy habits compound over time. Keep going!", condition: () => Math.random() < 0.2 },
    { id: 'e8', priority: 2, type: 'suggestion', text: () => "Be mindful of portion sizes, even for healthy foods. It's easy to overconsume calories without realizing.", condition: () => Math.random() < 0.2 },
    {
        id: 'e9', priority: 2, type: 'warning',
        text: () => "Skipping meals to 'save' calories can backfire, leading to overeating later and nutrient deficiencies. Aim for regular, balanced meals.",
        condition: (p,d) => ((d.meals.breakfast?.items?.length || 0) === 0 && (d.meals.lunch?.items?.length || 0) === 0) && new Date(d.date + "T16:00:00") < new Date()
    },
    { id: 'm9', priority: 3, type: 'suggestion', text: () => "Celebrate your milestones with non-food rewards, like a new workout gear, a book, or a relaxing day.", condition: () => Math.random() < 0.1 },
    {
        id: 'h2', priority: 2, type: 'suggestion',
        text: () => "Watch out for liquid calories! Sugary drinks, specialty coffees, and even some juices can add up quickly.",
        condition: (p, d) => Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/soda|juice|latte|frappe|sweet tea/))) // Simplified check
    },
    {
        id: 's1', priority: 3, type: 'info',
        text: () => "Setting small, achievable weekly goals can help you stay motivated and build momentum.",
        condition: () => Math.random() < 0.15
    },
    {
        id: 's2', priority: 2, type: 'suggestion',
        text: (name) => `If you're feeling hungry between meals, ${name}, opt for a healthy snack like fruit, yogurt, or a small handful of nuts.`,
        condition: (p,d) => (d.meals.snack?.items?.length || 0) === 0 && d.summary.kcal_consumed > 1000 && Math.random() < 0.3,
        calcParams: (p,d) => [p.name]
    },
    {
        id: 's3', priority: 1, type: 'praise',
        text: (name) => `Excellent discipline, ${name}! You've hit your calorie target and made healthy choices today.`,
        condition: (p, d) => p.goal && Math.abs(d.summary.net_kcal - calculateTargetCalories(p)) < 50 && d.summary.kcal_consumed > 1200, // Very close to target
        calcParams: (p,d) => [p.name]
    },
    {
        id: 's4', priority: 2, type: 'suggestion',
        text: () => "Feeling stressed? Physical activity is a great stress reliever. Even a short burst can help!",
        condition: (p,d) => d.summary.kcal_burned_exercise < 50 && Math.random() < 0.2 // Low activity and random chance
    }
];


const MAX_INITIALLY_VISIBLE_ADVICE = 2; // Show up to 2 initially
const MAX_TOTAL_VISIBLE_ADVICE = 6;     // Show up to 6 when "show more" is clicked

/**
 * AdviceBox component that displays personalized advice based on user's profile and diary data
 * @param {Object} userProfile - User's profile information
 * @param {Object} diaryData - User's diary data including meals and summary
 */
export default function AdviceBox({ userProfile, diaryData }) {
    const [allApplicableAdvice, setAllApplicableAdvice] = useState([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (!userProfile || !userProfile.id || !diaryData || !diaryData.summary || !diaryData.meals) {
            setAllApplicableAdvice([]);
            return;
        }

        const applicable = ADVICE_BANK
            .filter(advice => {
                try {
                    // Ensure diaryData.meals is available for conditions that might use it
                    if (!diaryData.meals) return false;
                    return advice.condition(userProfile, diaryData);
                } catch (e) {
                    // console.warn(`AdviceBox: Error in condition for advice ID ${advice.id}:`, e); // Optional: for debugging conditions
                    return false;
                }
            })
            .map(advice => {
                const textParams = advice.calcParams ? advice.calcParams(userProfile, diaryData) : [userProfile.name || 'there'];
                return {
                    ...advice,
                    displayText: typeof advice.text === 'function' ? advice.text(...textParams) : advice.text,
                };
            })
            .sort((a, b) => a.priority - b.priority);

        setAllApplicableAdvice(applicable);
        setShowAll(false);
    }, [userProfile, diaryData]);

    const getAdviceStyleInternal = (type) => { // Renamed to avoid conflict
        // ... (getAdviceStyle function from previous answer) ...
        switch (type) {
            case 'warning': return { emoji: '⚠️', color: 'text-red-700', bg: 'bg-red-50 border-red-300' };
            case 'suggestion': return { emoji: '💡', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-300' };
            case 'praise': return { emoji: '🎉', color: 'text-green-700', bg: 'bg-green-50 border-green-300' };
            case 'info':
            default: return { emoji: 'ℹ️', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-300' };
        }
    };

    const настроение_иконок = { /* ... как раньше ... */
        'warning': 'animate-pulse',
        'suggestion': '',
        'praise': 'animate-bounce-short',
        'info': ''
    };


    if (allApplicableAdvice.length === 0) {
        const style = getAdviceStyleInternal('info');
        return (
            <div className={`p-4 rounded-xl shadow-sm border ${style.bg} ${style.border}`}>
                <div className="flex items-start">
                    <span className="text-2xl mr-3 pt-1">{style.emoji}</span>
                    <div>
                        <h3 className={`text-md font-semibold ${style.color} mb-1`}>Tip of the day:</h3>
                        <p className={`text-sm ${style.color.replace('700', '900')}`}>
                            Keep tracking consistently to get personalized advice! Ensure your profile (weight, height, age, goal, gender, activity level) is up to date.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const visibleAdvice = showAll
        ? allApplicableAdvice.slice(0, MAX_TOTAL_VISIBLE_ADVICE)
        : allApplicableAdvice.slice(0, MAX_INITIALLY_VISIBLE_ADVICE);

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
                                <p className={`text-sm ${style.color.replace('700', '900').replace('bg-opacity-75', '')}`}> {/* Ensure text color is solid */}
                                    {advice.displayText}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}

            {allApplicableAdvice.length > MAX_INITIALLY_VISIBLE_ADVICE && !showAll && (
                <button
                    onClick={() => setShowAll(true)}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium py-2 px-3 rounded-md border border-blue-200 hover:bg-blue-50 transition"
                >
                    Show {Math.min(MAX_TOTAL_VISIBLE_ADVICE, allApplicableAdvice.length) - MAX_INITIALLY_VISIBLE_ADVICE} more tip(s)...
                    (Total {allApplicableAdvice.length} relevant tips)
                </button>
            )}
            {showAll && allApplicableAdvice.length > MAX_INITIALLY_VISIBLE_ADVICE && (
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
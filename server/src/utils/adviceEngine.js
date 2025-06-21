const { getCalculatedCalorieDetails } = require('./calorieCalculator');

// --- Advice Bank with Priority and Type ---
// Priority: 1 (High/Critical), 2 (Medium/Important), 3 (Low/General Tip)
// Type: 'warning', 'suggestion', 'info', 'praise'
const ADVICE_BANK = [
    // Calories - Priority 1 (Warnings)
    {
        id: 'c1', priority: 1, type: 'warning',
        text: (name, diff) => `${name}, you've significantly exceeded your calorie target by ~${Math.abs(diff)} kcal. Consistent overeating can hinder your goals.`,
        condition: (p, d, target) => p.goal && d.summary.net_kcal > (target + 500),
        calcParams: (p, d, target) => [p.name, Math.round(d.summary.net_kcal - target)]
    },
    {
        id: 'c2', priority: 1, type: 'warning',
        text: (name, diff) => `${name}, you're well below your calorie target by ~${Math.abs(diff)} kcal. If your goal isn't significant weight loss, ensure you're eating enough for energy and nutrients.`,
        condition: (p, d, target) => p.goal !== 'lose' && d.summary.net_kcal < (target - 500),
        calcParams: (p, d, target) => [p.name, Math.round(d.summary.net_kcal - target)]
    },
    {
        id: 'c3', priority: 1, type: 'warning',
        text: (name, diff) => `For weight loss, a deficit is key, but being ~${Math.abs(diff)} kcal below target, ${name}, might be too restrictive. Focus on sustainable habits.`,
        condition: (p, d, target) => p.goal === 'lose' && d.summary.net_kcal < (target - 700),
        calcParams: (p, d, target) => [p.name, Math.round(d.summary.net_kcal - target)]
    },
    // Macros - Priority 1 (Warnings)
    {
        id: 'm1', priority: 1, type: 'warning',
        text: (name) => `Hey ${name}, your fat intake appears quite high today. While fats are important, balance is key. Review your food choices.`,
        condition: (p, d, target) => d.summary.kcal_consumed > 1200 && d.summary.fat > ((d.summary.kcal_consumed * 0.40) / 9),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'm2', priority: 1, type: 'warning',
        text: (name) => `${name}, a large portion of your calories today came from carbohydrates. Ensure these are primarily complex carbs for sustained energy.`,
        condition: (p, d, target) => d.summary.kcal_consumed > 1200 && d.summary.carbs > ((d.summary.kcal_consumed * 0.65) / 4),
        calcParams: (p, d, target) => [p.name]
    },
    // Macros - Priority 2 (Suggestions)
    {
        id: 'm3', priority: 2, type: 'suggestion',
        text: (name) => `Your protein intake is a bit on the lower side today, ${name}. Try incorporating more lean protein sources like chicken, fish, beans, or tofu.`,
        condition: (p, d, target) => p.weight && d.summary.kcal_consumed > 800 && d.summary.protein < (p.weight * 1.2),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'm4', priority: 2, type: 'praise',
        text: (name) => `Great job on hitting your protein target today, ${name}! This supports muscle health and satiety.`,
        condition: (p, d, target) => p.weight && d.summary.protein >= (p.weight * 1.6),
        calcParams: (p, d, target) => [p.name]
    },
    // Activity - Priority 2
    {
        id: 'a1', priority: 2, type: 'praise',
        text: () => "Fantastic effort with your physical activity today! Every bit of movement counts.",
        condition: (p, d, target) => d.summary.kcal_burned_exercise >= 300
    },
    {
        id: 'a2', priority: 2, type: 'suggestion',
        text: () => "It seems like a less active day today. How about a brisk 20-minute walk to boost your energy?",
        condition: (p, d, target) => d.summary.kcal_burned_exercise < 100 && d.loggedActivities.length === 0
    },
    // Diet Composition - Priority 2 (Dynamic based on what user has eaten)
    {
        id: 'v1', priority: 2, type: 'suggestion',
        text: (name) => `Aim to include more colorful vegetables in your meals, ${name}. They're nutritional powerhouses!`,
        condition: (p, d, target) => !Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/vegetable|salad|broccoli|spinach|carrot|tomato/))),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'v1_praise', priority: 2, type: 'praise',
        text: (name) => `Excellent choice including vegetables today, ${name}! You're getting those essential vitamins and fiber.`,
        condition: (p, d, target) => Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/vegetable|salad|broccoli|spinach|carrot|tomato/))),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'f1', priority: 2, type: 'suggestion',
        text: (name) => `A piece of fruit or a handful of berries can be a great way to add vitamins and natural sweetness, ${name}.`,
        condition: (p, d, target) => !Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/fruit|apple|banana|orange|berry|berries/))),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'f1_praise', priority: 2, type: 'praise',
        text: (name) => `Great job adding fruit to your day, ${name}! Natural sweetness and vitamins are always a smart choice.`,
        condition: (p, d, target) => Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/fruit|apple|banana|orange|berry|berries/))),
        calcParams: (p, d, target) => [p.name]
    },
    // Protein variety - Dynamic
    {
        id: 'protein_variety_suggestion', priority: 2, type: 'suggestion',
        text: (name) => `Consider diversifying your protein sources today, ${name}. Fish, eggs, legumes, or tofu can add variety to your nutrition.`,
        condition: (p, d, target) => {
            const proteinSources = new Set();
            Object.values(d.meals).forEach(meal => {
                (meal.items || []).forEach(item => {
                    if (item.name?.toLowerCase().match(/chicken|beef|pork|meat/)) proteinSources.add('meat');
                    if (item.name?.toLowerCase().match(/fish|salmon|tuna/)) proteinSources.add('fish');
                    if (item.name?.toLowerCase().match(/egg/)) proteinSources.add('eggs');
                    if (item.name?.toLowerCase().match(/bean|legume|tofu/)) proteinSources.add('plant');
                });
            });
            return proteinSources.size <= 1 && d.summary.protein > 20;
        },
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'protein_variety_praise', priority: 2, type: 'praise',
        text: (name) => `Excellent protein variety today, ${name}! Mixing different protein sources ensures you get all essential amino acids.`,
        condition: (p, d, target) => {
            const proteinSources = new Set();
            Object.values(d.meals).forEach(meal => {
                (meal.items || []).forEach(item => {
                    if (item.name?.toLowerCase().match(/chicken|beef|pork|meat/)) proteinSources.add('meat');
                    if (item.name?.toLowerCase().match(/fish|salmon|tuna/)) proteinSources.add('fish');
                    if (item.name?.toLowerCase().match(/egg/)) proteinSources.add('eggs');
                    if (item.name?.toLowerCase().match(/bean|legume|tofu/)) proteinSources.add('plant');
                });
            });
            return proteinSources.size >= 3 && d.summary.protein > 30;
        },
        calcParams: (p, d, target) => [p.name]
    },
    // Hydration & General Habits - Priority 3
    {
        id: 'h1', priority: 3, type: 'info',
        text: () => "Stay hydrated! Drinking enough water is crucial for overall health, energy, and even metabolism.",
        condition: () => Math.random() < 0.3
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
    // Meal Timing - Priority 2
    {
        id: 'e1', priority: 2, type: 'suggestion',
        text: (name, meal) => `It appears you might have missed ${meal} today, ${name}. Regular meal timing can help manage hunger and energy.`,
        condition: (p, d, target) => {
            const hour = new Date().getHours();
            if (hour >= 11 && (d.meals.breakfast?.items?.length || 0) === 0) return true;
            if (hour >= 16 && (d.meals.lunch?.items?.length || 0) === 0) return true;
            if (hour >= 21 && (d.meals.dinner?.items?.length || 0) === 0) return true;
            return false;
        },
        calcParams: (p, d, target) => {
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
        condition: (p, d, target) => {
            if (d.summary.kcal_consumed < 800) return false;
            return Object.values(d.meals).some(meal => (meal.items || []).reduce((sum, i) => sum + (i.kcal || 0), 0) > (d.summary.kcal_consumed * 0.60));
        },
        calcParams: (p, d, target) => {
            const [type] = Object.entries(d.meals).find(([type, meal]) => (meal.items || []).reduce((sum, i) => sum + (i.kcal || 0), 0) > (d.summary.kcal_consumed * 0.60)) || ['meal'];
            return [p.name, type];
        }
    },
    // Additional Advice
    {
        id: 'e3', priority: 3, type: 'info',
        text: () => "Eating a large meal very late might impact sleep quality. If possible, try to have your last big meal 2-3 hours before bed.",
        condition: (p, d, target) => (d.meals.dinner?.items?.length || 0) > 0 && new Date(d.date + "T21:30:00") < new Date() && Math.random() < 0.3
    },
    {
        id: 'p1', priority: 3, type: 'suggestion',
        text: () => "Diversify your protein! Consider fish, eggs, legumes, tofu, or Greek yogurt alongside meats.",
        condition: (p, d, target) => (d.summary.protein || 0) > 20 && Math.random() < 0.2
    },
    {
        id: 'f2', priority: 3, type: 'info',
        text: () => "Healthy fats are vital! Avocados, nuts, seeds, and olive oil are excellent sources.",
        condition: () => Math.random() < 0.2
    },
    {
        id: 'a3', priority: 2, type: 'suggestion',
        text: () => "Aim for consistent daily movement. Taking the stairs or a short walk during breaks adds up!",
        condition: (p, d, target) => d.summary.kcal_burned_exercise < 150 && Math.random() < 0.35
    },
    {
        id: 'a4', priority: 3, type: 'info',
        text: () => "Incorporating strength training 2-3 times a week helps build muscle, which boosts your metabolism.",
        condition: (p, d, target) => (p.goal === 'lose' || p.goal === 'gain' || p.goal === 'maintain') && Math.random() < 0.15
    },
    {
        id: 'm5', priority: 3, type: 'info',
        text: () => "Focus on progress, not perfection. Each healthy choice is a step in the right direction!",
        condition: () => Math.random() < 0.25
    },
    {
        id: 'm6', priority: 3, type: 'info',
        text: () => "Practice mindful eating: slow down, savor your food, and listen to your body's hunger and fullness signals.",
        condition: () => Math.random() < 0.2
    },
    {
        id: 'm7', priority: 3, type: 'suggestion',
        text: () => "Meal prepping or planning ahead can make healthy eating much easier during busy weeks.",
        condition: () => Math.random() < 0.15
    },
    {
        id: 'm8', priority: 2, type: 'info',
        text: (name) => `If you had a meal that was off-plan, ${name}, don't let it derail you. Just get back to your routine with the next meal.`,
        condition: (p, d, target) => p.goal && d.summary.kcal_consumed > (target + 700) && Math.random() < 0.4,
        calcParams: (p, d, target) => [p.name]
    },
    // Goal-specific praise
    {
        id: 'gl1', priority: 2, type: 'praise',
        text: (name) => `Well done, ${name}! You're effectively managing a calorie deficit for your weight loss goal today.`,
        condition: (p, d, target) => p.goal === 'lose' && d.summary.net_kcal < target && d.summary.net_kcal > (target - 600),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'gg1', priority: 2, type: 'praise',
        text: (name) => `Great job fueling your body, ${name}! A slight calorie surplus is helpful for your muscle gain objective.`,
        condition: (p, d, target) => p.goal === 'gain' && d.summary.net_kcal > target && d.summary.net_kcal < (target + 500),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'gm1', priority: 2, type: 'praise',
        text: () => "You're doing a good job maintaining your calorie balance today!",
        condition: (p, d, target) => p.goal === 'maintain' && Math.abs(d.summary.net_kcal - target) < 200
    },
    // Additional tips
    {
        id: 'e4', priority: 3, type: 'info',
        text: () => "Reading food labels helps you make informed choices about serving sizes and nutritional content.",
        condition: () => Math.random() < 0.1
    },
    {
        id: 'e5', priority: 2, type: 'suggestion',
        text: () => "Cooking at home gives you more control over ingredients, portions, and overall healthiness of your meals.",
        condition: (p, d, target) => !Object.values(d.meals).some(meal => (meal.items || []).some(item => item.type === 'recipe')) && Math.random() < 0.25
    },
    {
        id: 'e6', priority: 2, type: 'suggestion',
        text: () => "Try to limit highly processed foods. They often contain added sugars, unhealthy fats, and excess sodium.",
        condition: (p, d, target) => Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/chip|soda|candy|fast food|processed meat|sausage|hot dog/)))
    },
    {
        id: 'e7', priority: 3, type: 'info',
        text: () => "Aim for a balanced plate: roughly half vegetables/fruits, a quarter lean protein, and a quarter whole grains.",
        condition: () => Math.random() < 0.15
    },
    {
        id: 'm9', priority: 3, type: 'info',
        text: () => "Small, consistent healthy habits compound over time. Keep going!",
        condition: () => Math.random() < 0.2
    },
    {
        id: 'e8', priority: 2, type: 'suggestion',
        text: () => "Be mindful of portion sizes, even for healthy foods. It's easy to overconsume calories without realizing.",
        condition: () => Math.random() < 0.2
    },
    {
        id: 'e9', priority: 2, type: 'warning',
        text: () => "Skipping meals to 'save' calories can backfire, leading to overeating later and nutrient deficiencies. Aim for regular, balanced meals.",
        condition: (p, d, target) => ((d.meals.breakfast?.items?.length || 0) === 0 && (d.meals.lunch?.items?.length || 0) === 0) && new Date(d.date + "T16:00:00") < new Date()
    },
    {
        id: 'm10', priority: 3, type: 'suggestion',
        text: () => "Celebrate your milestones with non-food rewards, like a new workout gear, a book, or a relaxing day.",
        condition: () => Math.random() < 0.1
    },
    {
        id: 'h2', priority: 2, type: 'suggestion',
        text: () => "Watch out for liquid calories! Sugary drinks, specialty coffees, and even some juices can add up quickly.",
        condition: (p, d, target) => Object.values(d.meals).some(meal => (meal.items || []).some(item => item.name?.toLowerCase().match(/soda|juice|latte|frappe|sweet tea/)))
    },
    {
        id: 's1', priority: 3, type: 'info',
        text: () => "Setting small, achievable weekly goals can help you stay motivated and build momentum.",
        condition: () => Math.random() < 0.15
    },
    {
        id: 's2', priority: 2, type: 'suggestion',
        text: (name) => `If you're feeling hungry between meals, ${name}, opt for a healthy snack like fruit, yogurt, or a small handful of nuts.`,
        condition: (p, d, target) => (d.meals.snack?.items?.length || 0) === 0 && d.summary.kcal_consumed > 1000 && Math.random() < 0.3,
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 's3', priority: 1, type: 'praise',
        text: (name) => `Excellent discipline, ${name}! You've hit your calorie target and made healthy choices today.`,
        condition: (p, d, target) => p.goal && Math.abs(d.summary.net_kcal - target) < 50 && d.summary.kcal_consumed > 1200,
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 's4', priority: 2, type: 'suggestion',
        text: () => "Feeling stressed? Physical activity is a great stress reliever. Even a short burst can help!",
        condition: (p, d, target) => d.summary.kcal_burned_exercise < 50 && Math.random() < 0.2
    },
    // New dynamic advice based on user actions
    {
        id: 'breakfast_habit_praise', priority: 2, type: 'praise',
        text: (name) => `Great job having breakfast today, ${name}! Starting your day with a meal helps regulate your metabolism and energy levels.`,
        condition: (p, d, target) => (d.meals.breakfast?.items?.length || 0) > 0 && new Date().getHours() < 12,
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'breakfast_habit_suggestion', priority: 2, type: 'suggestion',
        text: (name) => `Consider having breakfast tomorrow, ${name}. It can help kickstart your metabolism and prevent overeating later.`,
        condition: (p, d, target) => (d.meals.breakfast?.items?.length || 0) === 0 && new Date().getHours() >= 12 && new Date().getHours() < 18,
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'home_cooking_praise', priority: 2, type: 'praise',
        text: (name) => `Excellent choice cooking at home today, ${name}! You have full control over ingredients and portions.`,
        condition: (p, d, target) => Object.values(d.meals).some(meal => (meal.items || []).some(item => item.type === 'recipe')),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'balanced_meal_praise', priority: 2, type: 'praise',
        text: (name) => `Perfect! You've included protein, carbs, and healthy fats in your meals today, ${name}. That's a well-balanced approach.`,
        condition: (p, d, target) => {
            const hasProtein = d.summary.protein > 20;
            const hasCarbs = d.summary.carbs > 30;
            const hasFat = d.summary.fat > 15;
            return hasProtein && hasCarbs && hasFat && d.summary.kcal_consumed > 800;
        },
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'fiber_rich_praise', priority: 2, type: 'praise',
        text: (name) => `Smart choice including fiber-rich foods today, ${name}! Fiber helps with satiety and digestive health.`,
        condition: (p, d, target) => Object.values(d.meals).some(meal => (meal.items || []).some(item => 
            item.name?.toLowerCase().match(/oat|quinoa|brown rice|whole grain|legume|bean|lentil|chickpea/)
        )),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'omega3_praise', priority: 2, type: 'praise',
        text: (name) => `Great job including omega-3 rich foods today, ${name}! These healthy fats support brain and heart health.`,
        condition: (p, d, target) => Object.values(d.meals).some(meal => (meal.items || []).some(item => 
            item.name?.toLowerCase().match(/salmon|tuna|mackerel|sardine|walnut|chia|flaxseed/)
        )),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'meal_spacing_praise', priority: 2, type: 'praise',
        text: (name) => `Good meal timing today, ${name}! Spacing meals 3-4 hours apart helps maintain steady energy levels.`,
        condition: (p, d, target) => {
            const mealCount = Object.values(d.meals).filter(meal => (meal.items || []).length > 0).length;
            return mealCount >= 3 && d.summary.kcal_consumed > 1000;
        },
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'hydration_reminder', priority: 2, type: 'suggestion',
        text: (name) => `Don't forget to stay hydrated, ${name}! Aim for 8 glasses of water throughout the day.`,
        condition: (p, d, target) => Math.random() < 0.4 && d.summary.kcal_consumed > 500,
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'post_workout_nutrition', priority: 2, type: 'suggestion',
        text: (name) => `Since you exercised today, ${name}, consider having a protein-rich snack within 30 minutes to support muscle recovery.`,
        condition: (p, d, target) => d.summary.kcal_burned_exercise > 200 && d.summary.protein < (p.weight * 1.2),
        calcParams: (p, d, target) => [p.name]
    },
    {
        id: 'post_workout_praise', priority: 2, type: 'praise',
        text: (name) => `Perfect post-workout nutrition, ${name}! You've fueled your body well after that exercise session.`,
        condition: (p, d, target) => d.summary.kcal_burned_exercise > 200 && d.summary.protein >= (p.weight * 1.2),
        calcParams: (p, d, target) => [p.name]
    }
];

/**
 * Generates personalized advice for users based on their profile and diary data
 * @param {Object} profile - User profile containing personal and nutritional data
 * @param {Object} diary - User's daily diary data including meals and summary
 * @returns {Array} Array of advice objects sorted by priority
 */
function getAdviceForUser(profile, diary) {
    // Validate input data
    if (!profile || !diary || !diary.summary || !diary.meals) return [];
    
    // Determine target calories: prioritize user-defined override, fallback to calculated values
    let target = 2000; // Default fallback value
    
    if (profile.target_calories_override && profile.target_calories_override > 0) {
        // Use user-defined target calories
        target = profile.target_calories_override;
    } else {
        // Use calculated target calories from profile data
        const { targetCalories } = getCalculatedCalorieDetails(profile);
        target = targetCalories || 2000;
    }

    // Filter and generate advice based on conditions
    return ADVICE_BANK
        .filter(advice => {
            try {
                return advice.condition(profile, diary, target);
            } catch (e) {
                // Silently handle any errors in advice conditions
                return false;
            }
        })
        .map(advice => {
            const params = advice.calcParams ? advice.calcParams(profile, diary, target) : [profile.name || 'there'];
            return {
                id: advice.id,
                type: advice.type,
                priority: advice.priority,
                text: typeof advice.text === 'function' ? advice.text(...params) : advice.text
            };
        })
        .sort((a, b) => a.priority - b.priority);
}

module.exports = { getAdviceForUser }; 
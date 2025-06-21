-- SQL commands to insert new achievements into local database
-- Run these commands in your MySQL database

-- First, clear existing achievements and reset auto increment
DELETE FROM UserAchievement;
DELETE FROM AchievementDefinition;
ALTER TABLE AchievementDefinition AUTO_INCREMENT = 1;

-- Insert new achievements
INSERT INTO `AchievementDefinition` (`id`, `name`, `description`, `icon_class`, `category`, `criteria_description`, `criteria_type`, `criteria_value_num`, `criteria_value_str`, `points`) VALUES
-- Getting Started Category (4 achievements)
(1, 'First Meal Logged', 'You successfully logged your first meal!', 'fas fa-utensils', 'Getting Started', 'Log any food item to any meal.', 'first_meal_log', 1.00, NULL, 10),
(2, 'Welcome Aboard', 'You created your account and started your health journey!', 'fas fa-user-plus', 'Getting Started', 'Complete account registration.', 'account_created', 1.00, NULL, 5),
(3, 'First Steps', 'You logged your first physical activity!', 'fas fa-shoe-prints', 'Getting Started', 'Log any physical activity.', 'first_activity_log', 1.00, NULL, 10),
(4, 'Goal Setter', 'You set your first health goal!', 'fas fa-bullseye', 'Getting Started', 'Set a weight goal (lose, gain, or maintain).', 'goal_set', 1.00, NULL, 5),

-- Consistency Category (4 achievements)
(5, 'Consistent Tracker - 7 Days', 'You tracked your food intake for 7 consecutive days. Way to build a habit!', 'fas fa-calendar-check', 'Consistency', 'Log food items for 7 days in a row.', 'consecutive_days_tracked', 7.00, NULL, 10),
(6, 'Week Warrior', 'You tracked your food intake for 14 consecutive days!', 'fas fa-calendar-week', 'Consistency', 'Log food items for 14 days in a row.', 'consecutive_days_tracked', 14.00, NULL, 20),
(7, 'Month Master', 'You tracked your food intake for 30 consecutive days!', 'fas fa-calendar-alt', 'Consistency', 'Log food items for 30 days in a row.', 'consecutive_days_tracked', 30.00, NULL, 50),
(8, 'Activity Streak', 'You logged physical activity for 7 consecutive days!', 'fas fa-fire', 'Consistency', 'Log physical activities for 7 days in a row.', 'consecutive_activity_days', 7.00, NULL, 25),

-- Nutrition Category (4 achievements)
(9, 'Protein Power', 'You hit your daily protein target!', 'fas fa-drumstick-bite', 'Nutrition', 'Meet your daily protein goal (1.6g per kg body weight).', 'protein_target_met_times', 1.00, NULL, 10),
(10, 'Balanced Eater', 'You met your daily calorie goal within 100 calories!', 'fas fa-balance-scale', 'Nutrition', 'Stay within 100 calories of your daily target.', 'calorie_target_met', 1.00, NULL, 15),
(11, 'Macro Master', 'You hit all three macro targets (protein, carbs, fat) in one day!', 'fas fa-chart-pie', 'Nutrition', 'Meet protein (1.6g/kg), fat (25% of calories), and carbs (45% of calories) targets in a single day.', 'all_macros_met', 1.00, NULL, 25),
(12, 'Food Variety', 'You logged 5+ different food categories today!', 'fas fa-apple-alt', 'Nutrition', 'Include 5+ different food categories in your daily meals.', 'food_variety_day', 5.00, NULL, 10),

-- Activity Category (4 achievements)
(13, 'Active Day', 'You burned over 300 calories through exercise today!', 'fas fa-fire', 'Activity', 'Log activities totaling over 300 kcal burned in one day.', 'calories_burned_day', 300.00, NULL, 10),
(14, 'Calorie Burner', 'You burned over 500 calories through exercise today!', 'fas fa-fire', 'Activity', 'Log activities totaling over 500 kcal burned in one day.', 'calories_burned_day', 500.00, NULL, 20),
(15, 'Endurance Builder', 'You completed a 45+ minute workout!', 'fas fa-clock', 'Activity', 'Log a single activity lasting 45+ minutes.', 'long_workout', 45.00, NULL, 15),
(16, 'Weekly Warrior', 'You burned over 2000 calories through exercise this week!', 'fas fa-calendar-week', 'Activity', 'Burn 2000+ calories through exercise in 7 days.', 'weekly_calories_burned', 2000.00, NULL, 30),

-- Foodie Category (4 achievements)
(17, 'Recipe Master', 'You created 5 custom recipes.', 'fas fa-book-open', 'Foodie', 'Save 5 or more recipes.', 'recipes_created', 5.00, NULL, 10),
(18, 'Recipe Creator', 'You created 10 custom recipes!', 'fas fa-book-open', 'Foodie', 'Save 10 or more recipes.', 'recipes_created', 10.00, NULL, 20),
(19, 'Recipe User', 'You used a custom recipe in your meal!', 'fas fa-book-open', 'Foodie', 'Log a meal using any custom recipe.', 'own_recipes_used', 1.00, NULL, 10),
(20, 'Home Chef', 'You used your own recipes for 5 meals!', 'fas fa-home', 'Foodie', 'Log 5 meals using your custom recipes.', 'own_recipes_used', 5.00, NULL, 20),

-- Profile Category (4 achievements)
(21, 'Profile Complete', 'You filled out all your basic profile information.', 'fas fa-user-check', 'Profile', 'Ensure weight, height, age, gender, and activity level are set.', 'profile_complete', 1.00, NULL, 10),
(22, 'Data Enthusiast', 'You updated your profile information!', 'fas fa-edit', 'Profile', 'Update any profile field after initial setup.', 'profile_updated', 1.00, NULL, 5),
(23, 'Progress Tracker', 'You updated your weight in the tracker!', 'fas fa-chart-line', 'Profile', 'Update your weight in the weight tracker.', 'first_weight_log', 1.00, NULL, 10),
(24, 'Weight Tracker', 'You logged your weight for 7 consecutive days!', 'fas fa-weight', 'Profile', 'Log your weight for 7 days in a row.', 'consecutive_weight_logs', 7.00, NULL, 15),

-- Habits Category (4 achievements)
(25, 'Meal Logger', 'You logged 3 different meal types in one day!', 'fas fa-utensils', 'Habits', 'Log breakfast, lunch, and dinner in a single day.', 'meal_types_day', 3.00, NULL, 10),
(26, 'Complete Day', 'You logged all 4 meal types in one day!', 'fas fa-calendar-day', 'Habits', 'Log breakfast, lunch, dinner, and snack in one day.', 'meal_types_day', 4.00, NULL, 15),
(27, 'Regular Eater', 'You logged meals at consistent times for 7 days!', 'fas fa-clock', 'Habits', 'Log meals within 2-hour windows for 7 days.', 'consistent_meal_times', 7.00, NULL, 20),
(28, 'Meal Skipper No More', 'You logged all 4 meals for 7 consecutive days!', 'fas fa-utensils', 'Habits', 'Log breakfast, lunch, dinner, and snack for 7 days.', 'complete_meal_week', 7.00, NULL, 25);

-- Update AUTO_INCREMENT to 29
ALTER TABLE `AchievementDefinition` AUTO_INCREMENT = 29; 
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 21, 2025 at 10:50 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `CaloriesTracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `AchievementDefinition`
--

CREATE TABLE `AchievementDefinition` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `icon_class` varchar(100) DEFAULT 'fas fa-trophy',
  `category` varchar(50) DEFAULT 'General',
  `criteria_description` varchar(255) DEFAULT NULL,
  `criteria_type` varchar(50) DEFAULT NULL,
  `criteria_value_num` decimal(10,2) DEFAULT NULL,
  `criteria_value_str` varchar(255) DEFAULT NULL,
  `points` int(11) DEFAULT 10 COMMENT 'Optional points for gamification'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Definitions of all possible achievements';

--
-- Dumping data for table `AchievementDefinition`
--

INSERT INTO `AchievementDefinition` (`id`, `name`, `description`, `icon_class`, `category`, `criteria_description`, `criteria_type`, `criteria_value_num`, `criteria_value_str`, `points`) VALUES
(1, 'First Meal Logged', 'You successfully logged your first meal!', 'fas fa-utensils', 'Getting Started', 'Log any food item to any meal.', 'first_meal_log', 1.00, NULL, 10),
(2, 'Welcome Aboard', 'You created your account and started your health journey!', 'fas fa-user-plus', 'Getting Started', 'Complete account registration.', 'account_created', 1.00, NULL, 5),
(3, 'First Steps', 'You logged your first physical activity!', 'fas fa-shoe-prints', 'Getting Started', 'Log any physical activity.', 'first_activity_log', 1.00, NULL, 10),
(4, 'Goal Setter', 'You set your first health goal!', 'fas fa-bullseye', 'Getting Started', 'Set a weight goal (lose, gain, or maintain).', 'goal_set', 1.00, NULL, 5),
(5, 'Consistent Tracker - 7 Days', 'You tracked your food intake for 7 consecutive days. Way to build a habit!', 'fas fa-calendar-check', 'Consistency', 'Log food items for 7 days in a row.', 'consecutive_days_tracked', 7.00, NULL, 10),
(6, 'Week Warrior', 'You tracked your food intake for 14 consecutive days!', 'fas fa-calendar-week', 'Consistency', 'Log food items for 14 days in a row.', 'consecutive_days_tracked', 14.00, NULL, 20),
(7, 'Month Master', 'You tracked your food intake for 30 consecutive days!', 'fas fa-calendar-alt', 'Consistency', 'Log food items for 30 days in a row.', 'consecutive_days_tracked', 30.00, NULL, 50),
(8, 'Activity Streak', 'You logged physical activity for 7 consecutive days!', 'fas fa-fire', 'Consistency', 'Log physical activities for 7 days in a row.', 'consecutive_activity_days', 7.00, NULL, 25),
(9, 'Protein Power', 'You hit your daily protein target!', 'fas fa-drumstick-bite', 'Nutrition', 'Meet your daily protein goal (1.6g per kg body weight).', 'protein_target_met_times', 1.00, NULL, 10),
(10, 'Balanced Eater', 'You met your daily calorie goal within 100 calories!', 'fas fa-balance-scale', 'Nutrition', 'Stay within 100 calories of your daily target.', 'calorie_target_met', 1.00, NULL, 15),
(11, 'Macro Master', 'You hit all three macro targets (protein, carbs, fat) in one day!', 'fas fa-chart-pie', 'Nutrition', 'Meet protein (1.6g/kg), fat (25% of calories), and carbs (45% of calories) targets in a single day.', 'all_macros_met', 1.00, NULL, 25),
(12, 'Food Variety', 'You logged 5+ different food categories today!', 'fas fa-apple-alt', 'Nutrition', 'Include 5+ different food categories in your daily meals.', 'food_variety_day', 5.00, NULL, 10),
(13, 'Active Day', 'You burned over 300 calories through exercise today!', 'fas fa-fire', 'Activity', 'Log activities totaling over 300 kcal burned in one day.', 'calories_burned_day', 300.00, NULL, 10),
(14, 'Calorie Burner', 'You burned over 500 calories through exercise today!', 'fas fa-fire', 'Activity', 'Log activities totaling over 500 kcal burned in one day.', 'calories_burned_day', 500.00, NULL, 20),
(15, 'Endurance Builder', 'You completed a 45+ minute workout!', 'fas fa-clock', 'Activity', 'Log a single activity lasting 45+ minutes.', 'long_workout', 45.00, NULL, 15),
(16, 'Weekly Warrior', 'You burned over 2000 calories through exercise this week!', 'fas fa-calendar-week', 'Activity', 'Burn 2000+ calories through exercise in 7 days.', 'weekly_calories_burned', 2000.00, NULL, 30),
(17, 'Recipe Master', 'You created 5 custom recipes.', 'fas fa-book-open', 'Foodie', 'Save 5 or more recipes.', 'recipes_created', 5.00, NULL, 10),
(18, 'Recipe Creator', 'You created 10 custom recipes!', 'fas fa-book-open', 'Foodie', 'Save 10 or more recipes.', 'recipes_created', 10.00, NULL, 20),
(19, 'Meal Planner', 'You logged a complete day with all 4 meal types!', 'fas fa-clipboard-list', 'Foodie', 'Log breakfast, lunch, dinner, and snack in one day.', 'complete_meal_day', 4.00, NULL, 10),
(20, 'Home Chef', 'You used your own recipes for 5 meals!', 'fas fa-home', 'Foodie', 'Log 5 meals using your custom recipes.', 'own_recipes_used', 5.00, NULL, 20),
(21, 'Profile Complete', 'You filled out all your basic profile information.', 'fas fa-user-check', 'Profile', 'Ensure weight, height, age, gender, and activity level are set.', 'profile_complete', 1.00, NULL, 10),
(22, 'Data Enthusiast', 'You updated your profile information!', 'fas fa-edit', 'Profile', 'Update any profile field after initial setup.', 'profile_updated', 1.00, NULL, 5),
(23, 'Progress Tracker', 'You updated your weight in the tracker!', 'fas fa-chart-line', 'Profile', 'Update your weight in the weight tracker.', 'first_weight_log', 1.00, NULL, 10),
(24, 'Weight Tracker', 'You logged your weight for 7 consecutive days!', 'fas fa-weight', 'Profile', 'Log your weight for 7 days in a row.', 'consecutive_weight_logs', 7.00, NULL, 15),
(25, 'Meal Logger', 'You logged 3 different meal types in one day!', 'fas fa-utensils', 'Habits', 'Log breakfast, lunch, and dinner in a single day.', 'meal_types_day', 3.00, NULL, 10),
(26, 'Complete Day', 'You logged all 4 meal types in one day!', 'fas fa-calendar-day', 'Habits', 'Log breakfast, lunch, dinner, and snack in one day.', 'meal_types_day', 4.00, NULL, 15),
(27, 'Regular Eater', 'You logged meals at consistent times for 7 days!', 'fas fa-clock', 'Habits', 'Log meals within 2-hour windows for 7 days.', 'consistent_meal_times', 7.00, NULL, 20),
(28, 'Meal Skipper No More', 'You logged all 4 meals for 7 consecutive days!', 'fas fa-utensils', 'Habits', 'Log breakfast, lunch, dinner, and snack for 7 days.', 'complete_meal_week', 7.00, NULL, 25);

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `name` varchar(30) NOT NULL,
  `label` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `name`, `label`) VALUES
(1, 'vegetable', 'Vegetables'),
(2, 'fruit', 'Fruits'),
(3, 'meat', 'Meat'),
(4, 'poultry', 'Poultry'),
(5, 'fish', 'Fish'),
(6, 'grain', 'Grains & Cereals'),
(7, 'dairy', 'Dairy'),
(8, 'prepared', 'Prepared meal'),
(9, 'sweets', 'Sweets'),
(10, 'other', 'Other'),
(11, 'root_veg', 'Root Vegetables'),
(12, 'leafy_veg', 'Leafy Greens'),
(13, 'berry', 'Berries'),
(14, 'bakery', 'Bakery'),
(15, 'processed_meat', 'Processed Meat'),
(16, 'seafood', 'Seafood'),
(17, 'fermented_dairy', 'Fermented Dairy'),
(18, 'nuts_seeds', 'Nuts & Seeds'),
(19, 'oil_fat', 'Oils & Fats'),
(20, 'snack_fastfood', 'Snacks & Fast-food'),
(21, 'beverage', 'Beverages'),
(22, 'alcohol', 'Alcohol'),
(23, 'condiment', 'Condiments / Sauces'),
(24, 'soup_stew', 'Soups & Stews'),
(25, 'protein_product', 'Protein Products');

-- --------------------------------------------------------

--
-- Table structure for table `ExerciseDefinition`
--

CREATE TABLE `ExerciseDefinition` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `met_value` float DEFAULT NULL COMMENT 'Metabolic Equivalent of Task',
  `calories_per_minute` float DEFAULT NULL COMMENT 'Alternative or in addition to MET',
  `created_by` int(11) DEFAULT NULL COMMENT 'FK to User.id, if users can add custom exercises',
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 for private, 1 for public',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ExerciseDefinition`
--

INSERT INTO `ExerciseDefinition` (`id`, `name`, `description`, `met_value`, `calories_per_minute`, `created_by`, `is_public`, `created_at`, `updated_at`) VALUES
(1, 'test', 'test', 23, 23, 2, 0, '2025-05-20 09:22:12', '2025-05-20 09:22:12'),
(2, 'sadasd', 'sad', 23, 23, 2, 0, '2025-05-20 09:22:12', '2025-06-21 08:34:13'),
(3, 'Бег', 'просто бегать', 231, 213, 2, 0, '2025-05-20 12:09:24', '2025-05-20 12:09:24'),
(4, 'Прыжки', NULL, 13, 23, 2, 0, '2025-05-21 15:39:34', '2025-05-21 15:39:34'),
(5, 'JJUMPING', NULL, 32, 12, 8, 1, '2025-06-16 16:34:33', '2025-06-21 08:34:18'),
(7, 'Прыжочки', NULL, 21, 21, 8, 0, '2025-06-16 16:37:05', '2025-06-16 16:37:05'),
(8, 'Новый бег', NULL, 213, 23, 1, 0, '2025-06-16 16:56:40', '2025-06-16 16:56:40'),
(9, 'счяясчс', NULL, 21, 11, 1, 0, '2025-06-16 17:00:31', '2025-06-16 17:00:31'),
(10, 'Скручивания', 'крутись', NULL, 11, 18, 0, '2025-06-21 08:36:42', '2025-06-21 08:36:42');

-- --------------------------------------------------------

--
-- Table structure for table `meal`
--

CREATE TABLE `meal` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `meal_datetime` datetime DEFAULT NULL,
  `meal_type` varchar(50) DEFAULT NULL,
  `meal_date` date GENERATED ALWAYS AS (cast(`meal_datetime` as date)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `meal`
--

INSERT INTO `meal` (`id`, `user_id`, `meal_datetime`, `meal_type`) VALUES
(1, 2, '2025-05-19 00:00:00', 'breakfast'),
(4, 2, '2025-05-19 00:00:00', 'lunch'),
(5, 2, '2025-05-19 00:00:00', 'dinner'),
(11, 2, '2025-05-20 00:00:00', 'breakfast'),
(15, 2, '2025-05-19 00:00:00', 'snack'),
(18, 2, '2025-05-20 00:00:00', 'lunch'),
(19, 2, '2025-05-20 00:00:00', 'snack'),
(20, 2, '2025-05-21 00:00:00', ':type'),
(21, 2, '2025-05-21 00:00:00', 'breakfast'),
(22, 2, '2025-05-20 00:00:00', 'undefined'),
(26, 2, '2025-05-20 00:00:00', 'dinner'),
(31, 3, '2025-05-20 00:00:00', 'dinner'),
(32, 3, '2025-05-20 00:00:00', 'lunch'),
(34, 3, '2025-05-20 00:00:00', 'snack'),
(35, 3, '2025-05-20 00:00:00', 'breakfast'),
(44, 2, '2025-05-21 00:00:00', 'lunch'),
(45, 2, '2025-05-21 00:00:00', 'snack'),
(46, 2, '2025-05-21 00:00:00', 'dinner'),
(55, 2, '2025-05-22 00:00:00', 'dinner'),
(56, 2, '2025-05-22 00:00:00', 'snack'),
(58, 1, '2025-05-21 00:00:00', 'dinner'),
(59, 1, '2025-05-21 00:00:00', 'lunch'),
(60, 1, '2025-05-21 00:00:00', 'breakfast'),
(61, 3, '2025-05-21 00:00:00', 'breakfast'),
(62, 3, '2025-05-21 00:00:00', 'snack'),
(64, 2, '2025-05-25 00:00:00', 'snack'),
(67, 2, '2025-05-25 00:00:00', 'breakfast'),
(68, 2, '2025-05-25 00:00:00', 'lunch'),
(69, 2, '2025-05-25 00:00:00', 'dinner'),
(78, 2, '2025-05-27 00:00:00', 'lunch'),
(79, 2, '2025-05-27 00:00:00', 'dinner'),
(80, 2, '2025-05-27 00:00:00', 'snack'),
(81, 2, '2025-05-27 00:00:00', 'breakfast'),
(87, 2, '2025-06-07 00:00:00', 'lunch'),
(88, 2, '2025-06-07 00:00:00', 'breakfast'),
(89, 2, '2025-06-07 00:00:00', 'dinner'),
(92, 3, '2025-06-08 00:00:00', 'breakfast'),
(93, 3, '2025-06-08 00:00:00', 'lunch'),
(94, 1, '2025-06-05 00:00:00', 'lunch'),
(95, 1, '2025-06-08 00:00:00', 'breakfast'),
(96, 1, '2025-06-07 00:00:00', 'dinner'),
(97, 2, '2025-06-08 00:00:00', 'lunch'),
(98, 2, '2025-06-08 00:00:00', 'snack'),
(99, 2, '2025-06-06 00:00:00', 'dinner'),
(100, 2, '2025-06-05 00:00:00', 'snack'),
(101, 2, '2025-06-05 00:00:00', 'breakfast'),
(102, 2, '2025-06-04 00:00:00', 'breakfast'),
(103, 2, '2025-06-11 00:00:00', 'breakfast'),
(104, 2, '2025-06-11 00:00:00', 'lunch'),
(105, 2, '2025-06-11 00:00:00', 'dinner'),
(106, 2, '2025-06-11 00:00:00', 'snack'),
(107, 1, '2025-06-11 00:00:00', 'breakfast'),
(108, 7, '2025-06-11 00:00:00', 'lunch'),
(119, 7, '2025-06-11 00:00:00', 'snack'),
(120, 7, '2025-06-11 00:00:00', 'breakfast'),
(121, 7, '2025-06-10 00:00:00', 'lunch'),
(123, 7, '2025-06-08 00:00:00', 'breakfast'),
(124, 7, '2025-06-11 00:00:00', 'dinner'),
(127, 1, '2025-06-11 00:00:00', 'lunch'),
(128, 3, '2025-06-15 00:00:00', 'breakfast'),
(129, 3, '2025-06-15 00:00:00', 'dinner'),
(130, 2, '2025-06-16 00:00:00', 'breakfast'),
(132, 2, '2025-06-16 00:00:00', 'lunch'),
(133, 1, '2025-06-16 00:00:00', 'lunch'),
(134, 18, '2025-06-20 00:00:00', 'breakfast'),
(139, 18, '2025-06-20 00:00:00', 'dinner'),
(143, 18, '2025-06-20 00:00:00', 'lunch'),
(146, 18, '2025-06-21 00:00:00', 'breakfast'),
(147, 18, '2025-06-21 00:00:00', 'lunch'),
(151, 18, '2025-06-21 00:00:00', 'snack'),
(152, 18, '2025-06-21 00:00:00', 'dinner'),
(155, 2, '2025-06-21 00:00:00', 'breakfast'),
(157, 2, '2025-06-21 00:00:00', 'lunch'),
(158, 2, '2025-06-21 00:00:00', 'snack'),
(159, 2, '2025-06-21 00:00:00', 'dinner');

-- --------------------------------------------------------

--
-- Table structure for table `MealProduct`
--

CREATE TABLE `MealProduct` (
  `id` int(11) NOT NULL,
  `meal_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_amount` float DEFAULT NULL,
  `recipe_id` int(11) DEFAULT NULL COMMENT 'FK to Recipe.id, if this entry is a recipe',
  `servings_consumed` float DEFAULT NULL COMMENT 'Количество порций рецепта (используется, если recipe_id не NULL)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `MealProduct`
--

INSERT INTO `MealProduct` (`id`, `meal_id`, `product_id`, `product_amount`, `recipe_id`, `servings_consumed`) VALUES
(1, 1, NULL, 100, NULL, NULL),
(2, 1, NULL, 1002, NULL, NULL),
(3, 4, NULL, 109, NULL, NULL),
(4, 5, NULL, 1001, NULL, NULL),
(5, 5, NULL, 100, NULL, NULL),
(6, 11, NULL, 100, NULL, NULL),
(7, 11, NULL, 100, NULL, NULL),
(8, 15, NULL, 100, NULL, NULL),
(9, 15, NULL, 100, NULL, NULL),
(10, 18, NULL, 10011, NULL, NULL),
(12, 22, NULL, 100, NULL, NULL),
(13, 11, NULL, 100, NULL, NULL),
(14, 26, NULL, NULL, NULL, 1),
(15, 26, NULL, NULL, 1, 1),
(16, 26, NULL, NULL, 3, 1),
(17, 19, NULL, NULL, 5, 1),
(18, 18, NULL, NULL, 5, 1),
(19, 31, NULL, 100, NULL, NULL),
(20, 32, NULL, NULL, 6, 1.2),
(21, 32, NULL, NULL, NULL, 1),
(22, 34, NULL, NULL, NULL, 1),
(25, 35, NULL, NULL, 6, 1.5),
(26, 35, NULL, 99, NULL, NULL),
(27, 31, NULL, NULL, 8, 1.5),
(28, 34, NULL, 155, NULL, NULL),
(29, 21, NULL, NULL, NULL, 0.5),
(32, 44, NULL, 100, NULL, NULL),
(33, 45, NULL, 100, NULL, NULL),
(34, 46, NULL, NULL, NULL, 1),
(35, 46, NULL, 100, NULL, NULL),
(36, 46, NULL, 100, NULL, NULL),
(37, 45, NULL, 100, NULL, NULL),
(38, 45, NULL, 100, NULL, NULL),
(39, 44, NULL, 100, NULL, NULL),
(40, 45, NULL, NULL, NULL, 1),
(41, 45, NULL, 100, NULL, NULL),
(42, 45, NULL, NULL, NULL, 1),
(43, 55, NULL, NULL, NULL, 1),
(44, 56, NULL, NULL, 3, 5),
(45, 56, NULL, NULL, NULL, 11),
(46, 58, NULL, 100, NULL, NULL),
(47, 59, NULL, NULL, NULL, 1),
(48, 60, NULL, 100, NULL, NULL),
(49, 61, NULL, NULL, 8, 1),
(50, 62, NULL, NULL, 6, 1),
(51, 62, NULL, 100, NULL, NULL),
(52, 64, NULL, 100, NULL, NULL),
(57, 69, NULL, NULL, 14, 1),
(61, 67, NULL, NULL, 3, 1),
(63, 67, NULL, 100, NULL, NULL),
(64, 67, NULL, NULL, 5, 1),
(65, 68, NULL, 100, NULL, NULL),
(67, 79, NULL, 220, NULL, NULL),
(68, 80, NULL, 100, NULL, NULL),
(69, 81, NULL, 1100, NULL, NULL),
(70, 80, NULL, 100, NULL, NULL),
(75, 87, NULL, NULL, 1, 0.4),
(76, 88, NULL, 333, NULL, NULL),
(77, 89, NULL, 100, NULL, NULL),
(78, 88, NULL, NULL, 4, 1),
(79, 88, NULL, NULL, 5, 1),
(80, 92, NULL, 245, NULL, NULL),
(81, 93, NULL, 232, NULL, NULL),
(82, 94, NULL, 123, NULL, NULL),
(83, 95, NULL, 100, NULL, NULL),
(84, 96, NULL, 666, NULL, NULL),
(85, 97, NULL, 333, NULL, NULL),
(86, 98, NULL, 121, NULL, NULL),
(87, 99, NULL, NULL, 1, 1),
(88, 100, NULL, 100, NULL, NULL),
(89, 101, NULL, 100, NULL, NULL),
(90, 102, NULL, 6678, NULL, NULL),
(91, 103, NULL, 600, NULL, NULL),
(92, 104, NULL, 155, NULL, NULL),
(93, 105, NULL, 100, NULL, NULL),
(94, 106, NULL, 100, NULL, NULL),
(95, 107, NULL, NULL, 17, 2),
(104, 108, NULL, NULL, 22, 1),
(105, 106, NULL, NULL, 16, 1),
(106, 103, NULL, NULL, 1, 1),
(107, 119, NULL, NULL, 22, 2),
(108, 120, NULL, NULL, 22, 1),
(109, 121, NULL, NULL, 22, 1),
(110, 119, NULL, NULL, 22, 1),
(111, 123, NULL, NULL, 22, 1),
(112, 124, NULL, NULL, 22, 1),
(113, 105, NULL, 100, NULL, NULL),
(114, 105, NULL, NULL, 1, 1),
(115, 127, NULL, 100, NULL, NULL),
(116, 128, NULL, 100, NULL, NULL),
(117, 129, NULL, NULL, 8, 1),
(118, 130, NULL, 100, NULL, NULL),
(119, 130, NULL, NULL, 16, 1),
(120, 132, NULL, NULL, 5, 3),
(121, 133, NULL, NULL, 17, 1),
(132, 143, 39, 555, NULL, NULL),
(133, 139, 39, 100, NULL, NULL),
(136, 146, 39, 50, NULL, NULL),
(137, 146, 41, 100, NULL, NULL),
(139, 151, 41, 100, NULL, NULL),
(140, 152, 41, 100, NULL, NULL),
(141, 147, 41, 100, NULL, NULL),
(143, 155, 40, 100, NULL, NULL),
(144, 155, 41, 100, NULL, NULL),
(145, 157, 41, 100, NULL, NULL),
(146, 158, 41, 100, NULL, NULL),
(147, 159, 41, 100, NULL, NULL),
(148, 151, 41, 555, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `PhysicalActivity`
--

CREATE TABLE `PhysicalActivity` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `exercise_definition_id` int(11) DEFAULT NULL,
  `activity_date` date DEFAULT NULL,
  `activity_type` varchar(100) DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `calories_burned` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `PhysicalActivity`
--

INSERT INTO `PhysicalActivity` (`id`, `user_id`, `exercise_definition_id`, `activity_date`, `activity_type`, `duration_minutes`, `calories_burned`) VALUES
(1, 2, 1, '2025-05-21', 'test', 30, 575),
(3, 2, 1, '2025-05-21', 'test', 30, 575),
(5, 2, 1, '2025-05-21', 'test', 30, 575),
(6, 2, 3, '2025-05-21', 'Бег', 30, 5775),
(7, 2, 1, '2025-05-22', 'test', 30, 575),
(8, 2, 4, '2025-05-22', 'Прыжки', 2, 22),
(9, 2, 3, '2025-05-22', 'Бег', 11, 2118),
(10, 2, 1, '2025-05-21', 'test', 30, 575),
(11, 2, 4, '2025-05-29', 'Прыжки', 30, 325),
(12, 2, 4, '2025-05-22', 'Прыжки', 1, 11),
(13, 3, 2, '2025-05-21', 'sadasd', 11, 417),
(15, 2, 1, '2025-05-25', 'test', 30, 575),
(17, 1, 2, '2025-06-08', 'sadasd', 30, 851),
(18, 1, 2, '2025-06-05', 'sadasd', 44, 1248),
(19, 1, 2, '2025-06-06', 'sadasd', 56, 1589),
(21, 2, 4, '2025-06-05', 'Прыжки', 30, 455),
(22, 2, 3, '2025-06-11', 'Бег', 10, 2695),
(23, 2, 4, '2025-06-11', 'Прыжки', 30, 455),
(24, 2, 4, '2025-06-16', 'Прыжки', 30, 488),
(30, 2, 3, '2025-06-21', 'Бег', 30, 8894),
(31, 18, 10, '2025-06-21', 'Скручивания', 5, 55);

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `calories` int(11) DEFAULT NULL,
  `fat` float DEFAULT NULL,
  `protein` float DEFAULT NULL,
  `carbs` float DEFAULT NULL,
  `category_id` tinyint(3) UNSIGNED NOT NULL DEFAULT 10,
  `created_by` int(11) DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`id`, `name`, `calories`, `fat`, `protein`, `carbs`, `category_id`, `created_by`, `is_public`) VALUES
(39, 'Krit - Cuetara - crackers', 505, 26, 6.5, 60, 14, 2, 1),
(40, 'Yogueta - Marmelade', 348, 1, 2.4, 82.3, 9, 2, 1),
(41, 'Banana', 95, 0.2, 1.5, 21.8, 2, 18, 0);

-- --------------------------------------------------------

--
-- Table structure for table `Recipe`
--

CREATE TABLE `Recipe` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `total_servings` float NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Recipe`
--

INSERT INTO `Recipe` (`id`, `name`, `description`, `user_id`, `is_public`, `total_servings`, `created_at`, `updated_at`) VALUES
(1, 'wee', 'qwewe', 2, 0, 1, '2025-05-20 15:21:56', '2025-05-20 15:21:56'),
(3, 'Super Flow', NULL, 2, 0, 3, '2025-05-20 15:27:05', '2025-05-20 15:27:05'),
(4, 'ывфвф', NULL, 2, 0, 1, '2025-05-20 15:46:50', '2025-05-20 15:46:50'),
(5, 'йцуйцуй', 'йцуйцуйцу', 2, 0, 1, '2025-05-20 16:02:21', '2025-05-20 16:02:21'),
(6, 'Шоко Бум', NULL, 3, 0, 3, '2025-05-20 16:31:28', '2025-05-20 16:31:28'),
(8, 'Шоколадный бутик', NULL, 3, 0, 1, '2025-05-20 16:54:14', '2025-05-20 16:54:14'),
(14, 'Testovoe chat-to', NULL, 2, 0, 1, '2025-05-25 06:17:52', '2025-05-25 06:17:52'),
(16, 'Rulette', 'just meat with fish', 2, 0, 1, '2025-06-07 11:49:40', '2025-06-07 11:49:40'),
(17, 'Coffee Light', 'Light milk drink', 1, 0, 1, '2025-06-11 10:01:49', '2025-06-11 10:01:49'),
(19, 'asd', NULL, 1, 0, 1, '2025-06-11 10:03:32', '2025-06-11 10:03:32'),
(20, 'asdasd', NULL, 1, 0, 1, '2025-06-11 10:03:40', '2025-06-11 10:03:40'),
(21, 'OHHHH', NULL, 1, 0, 1, '2025-06-11 10:03:51', '2025-06-11 10:03:51'),
(22, 'Cotege with sugar', NULL, 7, 0, 1, '2025-06-11 12:53:10', '2025-06-11 12:53:10'),
(23, 'Super Flow', NULL, 18, 0, 1, '2025-06-21 05:16:54', '2025-06-21 05:16:54');

-- --------------------------------------------------------

--
-- Table structure for table `RecipeIngredient`
--

CREATE TABLE `RecipeIngredient` (
  `id` int(11) NOT NULL,
  `recipe_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `amount_grams` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `RecipeIngredient`
--

INSERT INTO `RecipeIngredient` (`id`, `recipe_id`, `product_id`, `amount_grams`) VALUES
(48, 23, 39, 111),
(49, 23, 40, 222);

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE `User` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `height` float DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `activity_level` enum('sedentary','light','moderate','active','very_active') DEFAULT 'sedentary',
  `bmr_formula` enum('mifflin_st_jeor','harris_benedict','katch_mcardle') DEFAULT 'mifflin_st_jeor' COMMENT 'Selected BMR calculation formula',
  `body_fat_percentage` float DEFAULT NULL COMMENT 'Body fat percentage (for Katch-McArdle formula)',
  `target_calories_override` int(11) DEFAULT NULL COMMENT 'User-defined target daily calories, overrides calculation if set',
  `bmr` int(11) DEFAULT NULL COMMENT 'Calculated Basal Metabolic Rate (kcal)',
  `calculated_tdee` int(11) DEFAULT NULL COMMENT 'Calculated Total Daily Energy Expenditure (for display/reference)',
  `calculated_target_calories` int(11) DEFAULT NULL COMMENT 'Calculated target calories based on goal and TDEE (for display/reference)',
  `goal` varchar(100) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `User`
--

INSERT INTO `User` (`id`, `name`, `email`, `password`, `weight`, `height`, `age`, `gender`, `activity_level`, `bmr_formula`, `body_fat_percentage`, `target_calories_override`, `bmr`, `calculated_tdee`, `calculated_target_calories`, `goal`, `role`, `created_at`) VALUES
(1, 'Oliver', 'oleg@example.com', '$2b$10$XwpwQZxljmNbxefMIoklzuuofrGmDHci29cojcVf2d2D2Eu2dyz6O', 73, 175, 28, 'male', 'light', 'harris_benedict', NULL, NULL, 1747, 2402, 1902, 'lose', 'user', '2025-05-11 12:08:36'),
(2, 'Admin', 'allasuper@example.com', '$2b$10$/g8IDSay4U8eH.7iQhlAsu4pcn0H1huJjq9vxBXnOIRydtbxIbO6O', 77, 176, 25, 'female', 'light', 'mifflin_st_jeor', 19.8, NULL, 1584, 2178, 1678, 'lose', 'admin', '2025-05-11 12:26:23'),
(3, 'Alma', 'alma@example.com', '$2b$10$2K3dEi/lcBke9wEnJaTqz.8gsIQh4naIQW4Uo/gABTchHjpzz2OXu', 96, 179, 49, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, 1756, 2107, 1756, 'lose', 'user', '2025-05-12 10:17:13'),
(4, 'Alla Bugatti', 'losiha@example.com', '$2b$10$m42Zecf7ZkpsYhSiAs8teep3aXW/dxvgwVU5Se6vx92dYiARNp0QW', 23, 231, 23, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'gain', 'user', '2025-05-12 19:12:31'),
(7, 'Alice', 'alice@example.com', '$2b$10$YVyOMxjk/mgGShk3M2KJnODaNshQvneK261v4DM4GkyXiu1ySKQ8a', 63, 178, 22, 'female', 'sedentary', 'harris_benedict', 20.8, NULL, 1486, 1784, 1486, 'lose', 'user', '2025-06-11 12:50:48'),
(8, 'El', 'el@example.com', '$2b$10$rcwgBg7Dyob1csxz2x4Yde2prn.ROHHeVqML0lRYYzAulY3Ej7eZi', 65, 185, 20, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'gain', 'user', '2025-06-15 08:14:56'),
(18, 'Oliver', 'misteroliver@example.com', '$2b$10$gTTwHtIZkh1VP3Rc77Z33.1FTz3XiFbt6begSa9ZsWa5/U0bZkKOm', 72, 175, 28, 'male', 'sedentary', 'mifflin_st_jeor', NULL, 1501, 1679, 2015, 1679, 'lose', 'user', '2025-06-20 14:55:54'),
(19, 'Roman', 'roman@test.com', '$2b$10$wBX6wHRLF5ztzxCaKZO6jeRo8ONuxe/8TOS4wRlNlBnPPVcXZvehq', 73, 185, 25, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'maintain', 'user', '2025-06-20 14:59:19'),
(20, 'Maria', 'maria@example.com', '$2b$10$DWh/vH0jwyYAO3f5eUUd3etU8Nj6.LqDbYtPZFTzGfztyGasL7KAa', 87, 167, 21, 'female', 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'lose', 'user', '2025-06-20 15:05:24'),
(21, 'Ariel', 'ariel@example.com', '$2b$10$PW1wKihWLIFxyPIPcjqbQunIPvFJhtftIIvmSYvtddW7OwMywCpDC', 77, 181, 24, 'male', 'moderate', 'mifflin_st_jeor', NULL, NULL, 1786, 2769, 2769, 'maintain', 'user', '2025-06-20 15:07:15'),
(22, 'Velen', 'wowVelen123@example.com', '$2b$10$eDD1R23MVpSIEs70lsMyvONhBgXRmf4H5yjizC4C0DnRfNzKTubLq', 71, 200, 65, 'male', 'light', 'mifflin_st_jeor', NULL, NULL, 1640, 2255, 2555, 'gain', 'user', '2025-06-20 15:10:40');

-- --------------------------------------------------------

--
-- Table structure for table `UserAchievement`
--

CREATE TABLE `UserAchievement` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `achievement_definition_id` int(11) NOT NULL,
  `achieved_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks which achievements users have earned';

--
-- Dumping data for table `UserAchievement`
--

INSERT INTO `UserAchievement` (`id`, `user_id`, `achievement_definition_id`, `achieved_date`) VALUES
(33, 18, 23, '2025-06-21 08:29:50'),
(34, 18, 21, '2025-06-21 08:29:50'),
(35, 18, 22, '2025-06-21 08:29:50'),
(36, 18, 25, '2025-06-21 08:29:58'),
(37, 18, 26, '2025-06-21 08:29:58'),
(38, 18, 1, '2025-06-21 08:30:00'),
(39, 2, 5, '2025-06-21 08:30:18'),
(40, 2, 16, '2025-06-21 08:30:18'),
(42, 2, 20, '2025-06-21 08:30:18'),
(44, 2, 21, '2025-06-21 08:30:18'),
(46, 2, 23, '2025-06-21 08:30:47'),
(47, 2, 22, '2025-06-21 08:30:47'),
(48, 2, 1, '2025-06-21 08:31:03'),
(49, 2, 25, '2025-06-21 08:31:15'),
(50, 2, 26, '2025-06-21 08:31:17'),
(51, 2, 8, '2025-06-21 08:31:21'),
(52, 2, 13, '2025-06-21 08:31:21'),
(53, 2, 14, '2025-06-21 08:31:21'),
(54, 18, 13, '2025-06-21 08:35:24'),
(55, 18, 14, '2025-06-21 08:35:24'),
(56, 18, 16, '2025-06-21 08:35:24');

-- --------------------------------------------------------

--
-- Table structure for table `UserProgress`
--

CREATE TABLE `UserProgress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `calories_consumed` int(11) DEFAULT NULL,
  `calories_burned` int(11) DEFAULT NULL,
  `daily_fat` float DEFAULT NULL,
  `daily_carbs` float DEFAULT NULL,
  `daily_protein` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `weight_log`
--

CREATE TABLE `weight_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `weight` float NOT NULL,
  `log_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores historical weight data for users.';

--
-- Dumping data for table `weight_log`
--

INSERT INTO `weight_log` (`id`, `user_id`, `weight`, `log_date`) VALUES
(1, 2, 78, '2025-06-11'),
(3, 7, 63, '2025-06-11'),
(4, 1, 74, '2025-06-11'),
(5, 2, 75, '2025-06-15'),
(6, 2, 76, '2025-06-16'),
(7, 7, 63, '2025-06-16'),
(10, 3, 96, '2025-06-16'),
(11, 1, 73, '2025-06-16'),
(12, 2, 76, '2025-06-20'),
(13, 21, 77, '2025-06-20'),
(14, 22, 71, '2025-06-20'),
(15, 18, 75, '2025-06-20'),
(16, 18, 72, '2025-06-21'),
(28, 2, 77, '2025-06-21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `AchievementDefinition`
--
ALTER TABLE `AchievementDefinition`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_achievement_def_name` (`name`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `ExerciseDefinition`
--
ALTER TABLE `ExerciseDefinition`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ex_created_by` (`created_by`);

--
-- Indexes for table `meal`
--
ALTER TABLE `meal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_user_date_type` (`user_id`,`meal_date`,`meal_type`);

--
-- Indexes for table `MealProduct`
--
ALTER TABLE `MealProduct`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mp_meal_id` (`meal_id`),
  ADD KEY `idx_mp_product_id_nullable` (`product_id`),
  ADD KEY `idx_mp_recipe_id` (`recipe_id`);

--
-- Indexes for table `PhysicalActivity`
--
ALTER TABLE `PhysicalActivity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pa_exercise_def` (`exercise_definition_id`),
  ADD KEY `idx_physicalactivity_user_id` (`user_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_product_cat` (`category_id`),
  ADD KEY `fk_product_created_by_user` (`created_by`);

--
-- Indexes for table `Recipe`
--
ALTER TABLE `Recipe`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_recipe_user` (`user_id`);

--
-- Indexes for table `RecipeIngredient`
--
ALTER TABLE `RecipeIngredient`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_recipe_product` (`recipe_id`,`product_id`),
  ADD KEY `fk_ri_product` (`product_id`);

--
-- Indexes for table `User`
--
ALTER TABLE `User`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_email` (`email`);

--
-- Indexes for table `UserAchievement`
--
ALTER TABLE `UserAchievement`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_achievement_def` (`user_id`,`achievement_definition_id`),
  ADD KEY `fk_userachievement_achdef` (`achievement_definition_id`);

--
-- Indexes for table `UserProgress`
--
ALTER TABLE `UserProgress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `weight_log`
--
ALTER TABLE `weight_log`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_date` (`user_id`,`log_date`),
  ADD KEY `fk_weightlog_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `AchievementDefinition`
--
ALTER TABLE `AchievementDefinition`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `ExerciseDefinition`
--
ALTER TABLE `ExerciseDefinition`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `meal`
--
ALTER TABLE `meal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- AUTO_INCREMENT for table `MealProduct`
--
ALTER TABLE `MealProduct`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=149;

--
-- AUTO_INCREMENT for table `PhysicalActivity`
--
ALTER TABLE `PhysicalActivity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `Recipe`
--
ALTER TABLE `Recipe`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `RecipeIngredient`
--
ALTER TABLE `RecipeIngredient`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `UserAchievement`
--
ALTER TABLE `UserAchievement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `UserProgress`
--
ALTER TABLE `UserProgress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `weight_log`
--
ALTER TABLE `weight_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ExerciseDefinition`
--
ALTER TABLE `ExerciseDefinition`
  ADD CONSTRAINT `fk_ex_created_by` FOREIGN KEY (`created_by`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `meal`
--
ALTER TABLE `meal`
  ADD CONSTRAINT `meal_ibfk_1_cascade` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `MealProduct`
--
ALTER TABLE `MealProduct`
  ADD CONSTRAINT `fk_mp_meal` FOREIGN KEY (`meal_id`) REFERENCES `meal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mp_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mp_recipe` FOREIGN KEY (`recipe_id`) REFERENCES `Recipe` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `PhysicalActivity`
--
ALTER TABLE `PhysicalActivity`
  ADD CONSTRAINT `fk_pa_exercise_def` FOREIGN KEY (`exercise_definition_id`) REFERENCES `ExerciseDefinition` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_physicalactivity_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `fk_product_cat` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),
  ADD CONSTRAINT `fk_product_created_by_user` FOREIGN KEY (`created_by`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Recipe`
--
ALTER TABLE `Recipe`
  ADD CONSTRAINT `fk_recipe_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `RecipeIngredient`
--
ALTER TABLE `RecipeIngredient`
  ADD CONSTRAINT `fk_ri_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ri_recipe` FOREIGN KEY (`recipe_id`) REFERENCES `Recipe` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `UserAchievement`
--
ALTER TABLE `UserAchievement`
  ADD CONSTRAINT `fk_userachievement_achdef` FOREIGN KEY (`achievement_definition_id`) REFERENCES `AchievementDefinition` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_userachievement_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `UserProgress`
--
ALTER TABLE `UserProgress`
  ADD CONSTRAINT `userprogress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`);

--
-- Constraints for table `weight_log`
--
ALTER TABLE `weight_log`
  ADD CONSTRAINT `fk_weightlog_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

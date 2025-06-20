-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 20, 2025 at 12:07 PM
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
(2, 'Consistent Tracker - 7 Days', 'You tracked your food intake for 7 consecutive days. Way to build a habit!', 'fas fa-calendar-check', 'Consistency', 'Log food items for 7 days in a row.', 'consecutive_days_tracked', 7.00, NULL, 10),
(3, 'Protein Power', 'You hit your daily protein target!', 'fas fa-drumstick-bite', 'Nutrition', 'Meet your daily protein goal (e.g., 1.6g per kg body weight).', 'protein_target_met_times', 1.00, NULL, 10),
(4, 'Active Day', 'You burned over 300 calories through exercise today!', 'fas fa-fire', 'Activity', 'Log activities totaling over 300 kcal burned in one day.', 'calories_burned_day', 300.00, NULL, 10),
(5, 'Recipe Master', 'You created 5 custom recipes.', 'fas fa-book-open', 'Foodie', 'Save 5 or more recipes.', 'recipes_created', 5.00, NULL, 10),
(6, 'Profile Complete', 'You filled out all your basic profile information.', 'fas fa-user-check', 'Profile', 'Ensure weight, height, age, gender, and activity level are set.', 'profile_complete', 1.00, NULL, 10),
(7, 'Hydration Reminder', 'You acknowledged drinking enough water today.', 'fas fa-tint', 'Hydration', 'Manually confirm daily water intake (via a future feature).', 'manual_hydration_log', 1.00, NULL, 10),
(8, 'Early Riser Meal', 'Logged breakfast before 8:00 AM.', 'fas fa-sun', 'Habits', 'Log your breakfast entry before 8 AM on any day.', 'early_breakfast', 1.00, NULL, 10);

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
(2, 'sadasd', 'sad', 23, 23, 2, 1, '2025-05-20 09:22:12', '2025-05-20 09:22:12'),
(3, 'Бег', 'просто бегать', 231, 213, 2, 0, '2025-05-20 12:09:24', '2025-05-20 12:09:24'),
(4, 'Прыжки', NULL, 13, 23, 2, 0, '2025-05-21 15:39:34', '2025-05-21 15:39:34'),
(5, 'JJUMPING', NULL, 32, 12, 8, 0, '2025-06-16 16:34:33', '2025-06-16 16:34:33'),
(7, 'Прыжочки', NULL, 21, 21, 8, 0, '2025-06-16 16:37:05', '2025-06-16 16:37:05'),
(8, 'Новый бег', NULL, 213, 23, 1, 0, '2025-06-16 16:56:40', '2025-06-16 16:56:40'),
(9, 'счяясчс', NULL, 21, 11, 1, 0, '2025-06-16 17:00:31', '2025-06-16 17:00:31');

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
(133, 1, '2025-06-16 00:00:00', 'lunch');

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
(1, 1, 19, 100, NULL, NULL),
(2, 1, 23, 1002, NULL, NULL),
(3, 4, 20, 109, NULL, NULL),
(4, 5, 19, 1001, NULL, NULL),
(5, 5, 21, 100, NULL, NULL),
(6, 11, 20, 100, NULL, NULL),
(7, 11, 21, 100, NULL, NULL),
(8, 15, 14, 100, NULL, NULL),
(9, 15, 22, 100, NULL, NULL),
(10, 18, 18, 10011, NULL, NULL),
(12, 22, 20, 100, NULL, NULL),
(13, 11, 22, 100, NULL, NULL),
(14, 26, NULL, NULL, NULL, 1),
(15, 26, NULL, NULL, 1, 1),
(16, 26, NULL, NULL, 3, 1),
(17, 19, NULL, NULL, 5, 1),
(18, 18, NULL, NULL, 5, 1),
(19, 31, 25, 100, NULL, NULL),
(20, 32, NULL, NULL, 6, 1.2),
(21, 32, NULL, NULL, NULL, 1),
(22, 34, NULL, NULL, NULL, 1),
(25, 35, NULL, NULL, 6, 1.5),
(26, 35, 23, 99, NULL, NULL),
(27, 31, NULL, NULL, 8, 1.5),
(28, 34, 26, 155, NULL, NULL),
(29, 21, NULL, NULL, NULL, 0.5),
(32, 44, 31, 100, NULL, NULL),
(33, 45, 30, 100, NULL, NULL),
(34, 46, NULL, NULL, NULL, 1),
(35, 46, 30, 100, NULL, NULL),
(36, 46, 29, 100, NULL, NULL),
(37, 45, 16, 100, NULL, NULL),
(38, 45, 33, 100, NULL, NULL),
(39, 44, 31, 100, NULL, NULL),
(40, 45, NULL, NULL, NULL, 1),
(41, 45, 30, 100, NULL, NULL),
(42, 45, NULL, NULL, NULL, 1),
(43, 55, NULL, NULL, NULL, 1),
(44, 56, NULL, NULL, 3, 5),
(45, 56, NULL, NULL, NULL, 11),
(46, 58, 15, 100, NULL, NULL),
(47, 59, NULL, NULL, NULL, 1),
(48, 60, 26, 100, NULL, NULL),
(49, 61, NULL, NULL, 8, 1),
(50, 62, NULL, NULL, 6, 1),
(51, 62, 17, 100, NULL, NULL),
(52, 64, 13, 100, NULL, NULL),
(57, 69, NULL, NULL, 14, 1),
(61, 67, NULL, NULL, 3, 1),
(63, 67, 32, 100, NULL, NULL),
(64, 67, NULL, NULL, 5, 1),
(65, 68, 31, 100, NULL, NULL),
(67, 79, 31, 220, NULL, NULL),
(68, 80, 14, 100, NULL, NULL),
(69, 81, 30, 1100, NULL, NULL),
(70, 80, 34, 100, NULL, NULL),
(75, 87, NULL, NULL, 1, 0.4),
(76, 88, 31, 333, NULL, NULL),
(77, 89, 32, 100, NULL, NULL),
(78, 88, NULL, NULL, 4, 1),
(79, 88, NULL, NULL, 5, 1),
(80, 92, 28, 245, NULL, NULL),
(81, 93, 27, 232, NULL, NULL),
(82, 94, 13, 123, NULL, NULL),
(83, 95, 27, 100, NULL, NULL),
(84, 96, 4, 666, NULL, NULL),
(85, 97, 31, 333, NULL, NULL),
(86, 98, 4, 121, NULL, NULL),
(87, 99, NULL, NULL, 1, 1),
(88, 100, 30, 100, NULL, NULL),
(89, 101, 28, 100, NULL, NULL),
(90, 102, 31, 6678, NULL, NULL),
(91, 103, 29, 600, NULL, NULL),
(92, 104, 31, 155, NULL, NULL),
(93, 105, 28, 100, NULL, NULL),
(94, 106, 14, 100, NULL, NULL),
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
(113, 105, 38, 100, NULL, NULL),
(114, 105, NULL, NULL, 1, 1),
(115, 127, 37, 100, NULL, NULL),
(116, 128, 27, 100, NULL, NULL),
(117, 129, NULL, NULL, 8, 1),
(118, 130, 15, 100, NULL, NULL),
(119, 130, NULL, NULL, 16, 1),
(120, 132, NULL, NULL, 5, 3),
(121, 133, NULL, NULL, 17, 1);

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
(24, 2, 4, '2025-06-16', 'Прыжки', 30, 488);

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
(4, 'Tnuva Choco Bag', 65, 2, 3, 10, 7, NULL, 1),
(13, 'Test food', 123, 3, 2, 35, 5, 1, 0),
(14, 'Альма тест апд11', 123, 23, 23, 23, 18, 3, 0),
(15, 'Test food 77', 91, 23, 23, 23, 19, 1, 0),
(16, 'asd', 32, 23, 32, 32, 6, 2, 1),
(17, 'sdqwe', 12, 23, 45, 2321, 11, 2, 1),
(18, 'qweqw', 213, 23, 123, 231, 10, 2, 1),
(19, 'tyrye', 324, 342, 12, 32, 10, 2, 1),
(20, 'qwewqe', 213, 34, 32, 21, 10, 2, 1),
(21, 'qweqwe', 342, 34, 34, 34, 10, 2, 1),
(22, 'ewqewq', 231, 23, 23, 23, 10, 2, 1),
(23, 'Тестирую', 32, 23, 23, 23, 4, 2, 1),
(24, 'еууууу', 123, 23, 21, 23, 10, 2, 1),
(25, 'уцйуйцуйцуйцуйцу', 2323, 32, 23, 23, 10, 2, 1),
(26, 'выффв', 233, 23, 12, 21, 17, 2, 1),
(27, 'фыввфы', 213, 12, 21, 12, 10, 2, 1),
(28, 'Булочка', 350, 5, 13, 11, 9, 3, 0),
(29, 'Капуста', 28, 0.2, 1.8, 4.7, 1, NULL, 0),
(30, 'Картофель', 77, 0.4, 2, 16.3, 1, NULL, 0),
(31, 'Говядина', 250, 15, 26, 2, 3, NULL, 0),
(32, 'Свекла', 42, 0.1, 1.5, 8.8, 1, NULL, 0),
(33, 'qweqweq', 323, 3, 2, 23, 17, 2, 1),
(34, 'цуйцуцу', 323, 11, 12, 1, 14, 2, 1),
(36, 'Milk', 46, 3, 5, 3, 17, 1, 0),
(37, 'Sugar', 334, 0, 0, 32, 10, 1, 0),
(38, 'Sugar', 255, 0, 0, 31, 10, 7, 0);

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
(22, 'Cotege with sugar', NULL, 7, 0, 1, '2025-06-11 12:53:10', '2025-06-11 12:53:10');

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
(5, 3, 14, 222),
(6, 3, 16, 44),
(8, 5, 24, 100),
(9, 5, 22, 100),
(10, 5, 26, 100),
(11, 5, 4, 100),
(12, 4, 23, 100),
(13, 6, 14, 1000),
(14, 6, 4, 200),
(15, 1, 14, 250),
(16, 1, 25, 102),
(19, 8, 28, 100),
(20, 8, 4, 150),
(32, 14, 31, 100),
(33, 14, 30, 100),
(34, 14, 13, 111),
(38, 16, 31, 100),
(39, 16, 13, 100),
(40, 17, 36, 200),
(41, 17, 37, 100),
(43, 19, 34, 100),
(44, 20, 33, 100),
(45, 21, 13, 100),
(46, 22, 4, 159),
(47, 22, 38, 100);

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
(2, 'Алла', 'allasuper@example.com', '$2b$10$/g8IDSay4U8eH.7iQhlAsu4pcn0H1huJjq9vxBXnOIRydtbxIbO6O', 76, 176, 25, 'female', 'light', 'mifflin_st_jeor', 19.8, NULL, 1574, 2164, 1664, 'lose', 'admin', '2025-05-11 12:26:23'),
(3, 'Alma', 'alma@example.com', '$2b$10$2K3dEi/lcBke9wEnJaTqz.8gsIQh4naIQW4Uo/gABTchHjpzz2OXu', 96, 179, 49, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, 1756, 2107, 1756, 'lose', 'user', '2025-05-12 10:17:13'),
(4, 'Alla Bugatti', 'losiha@example.com', '$2b$10$m42Zecf7ZkpsYhSiAs8teep3aXW/dxvgwVU5Se6vx92dYiARNp0QW', 23, 231, 23, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'gain', 'user', '2025-05-12 19:12:31'),
(7, 'Alice', 'alice@example.com', '$2b$10$YVyOMxjk/mgGShk3M2KJnODaNshQvneK261v4DM4GkyXiu1ySKQ8a', 63, 178, 22, 'female', 'sedentary', 'harris_benedict', 20.8, NULL, 1486, 1784, 1486, 'lose', 'user', '2025-06-11 12:50:48'),
(8, 'El', 'el@example.com', '$2b$10$rcwgBg7Dyob1csxz2x4Yde2prn.ROHHeVqML0lRYYzAulY3Ej7eZi', 65, 185, 20, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'gain', 'user', '2025-06-15 08:14:56');

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
(1, 2, 4, '2025-06-07 11:59:32'),
(2, 2, 6, '2025-06-07 11:59:32'),
(3, 3, 1, '2025-06-08 06:26:17'),
(4, 1, 4, '2025-06-08 06:55:35'),
(5, 1, 1, '2025-06-08 07:19:14'),
(6, 2, 1, '2025-06-08 07:43:49'),
(7, 1, 6, '2025-06-11 09:59:36'),
(8, 7, 6, '2025-06-11 12:53:15'),
(9, 7, 1, '2025-06-11 12:53:22');

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
(11, 1, 73, '2025-06-16');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `ExerciseDefinition`
--
ALTER TABLE `ExerciseDefinition`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `meal`
--
ALTER TABLE `meal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=134;

--
-- AUTO_INCREMENT for table `MealProduct`
--
ALTER TABLE `MealProduct`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=122;

--
-- AUTO_INCREMENT for table `PhysicalActivity`
--
ALTER TABLE `PhysicalActivity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `Recipe`
--
ALTER TABLE `Recipe`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `RecipeIngredient`
--
ALTER TABLE `RecipeIngredient`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `UserAchievement`
--
ALTER TABLE `UserAchievement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `UserProgress`
--
ALTER TABLE `UserProgress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `weight_log`
--
ALTER TABLE `weight_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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

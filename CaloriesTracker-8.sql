-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 31, 2025 at 07:07 AM
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
-- Table structure for table `Achievement`
--

CREATE TABLE `Achievement` (
  `id` int(11) NOT NULL,
  `achieved_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `AchievementProgress`
--

CREATE TABLE `AchievementProgress` (
  `achievement_id` int(11) DEFAULT NULL,
  `user_progress_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(4, 'Прыжки', NULL, 13, 23, 2, 0, '2025-05-21 15:39:34', '2025-05-21 15:39:34');

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
(42, 5, '2025-05-21 00:00:00', 'breakfast'),
(43, 5, '2025-05-21 00:00:00', 'lunch'),
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
(83, 6, '2025-05-27 00:00:00', 'dinner'),
(84, 6, '2025-05-27 00:00:00', 'snack'),
(85, 6, '2025-05-27 00:00:00', 'lunch');

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
(31, 43, NULL, NULL, 11, 1),
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
(71, 83, 26, 100, NULL, NULL),
(72, 84, 4, 330, NULL, NULL),
(73, 85, 25, 100, NULL, NULL),
(74, 84, 27, 100, NULL, NULL);

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
(15, 2, 1, '2025-05-25', 'test', 30, 575);

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
(29, 'Капуста', 28, 0.2, 1.8, 4.7, 1, 5, 0),
(30, 'Картофель', 77, 0.4, 2, 16.3, 1, 5, 0),
(31, 'Говядина', 250, 15, 26, 2, 3, 5, 0),
(32, 'Свекла', 42, 0.1, 1.5, 8.8, 1, 5, 0),
(33, 'qweqweq', 323, 3, 2, 23, 17, 2, 1),
(34, 'цуйцуцу', 323, 11, 12, 1, 14, 2, 1);

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
(11, 'Борщ', NULL, 5, 0, 4, '2025-05-21 10:12:52', '2025-05-21 10:12:52'),
(14, 'Testovoe chat-to', NULL, 2, 0, 1, '2025-05-25 06:17:52', '2025-05-25 06:17:52');

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
(25, 11, 29, 300),
(26, 11, 30, 200),
(27, 11, 31, 300),
(28, 11, 32, 200),
(32, 14, 31, 100),
(33, 14, 30, 100),
(34, 14, 13, 111);

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
(1, 'Oliver', 'oleg@example.com', '$2b$10$XwpwQZxljmNbxefMIoklzuuofrGmDHci29cojcVf2d2D2Eu2dyz6O', 74, 175, 28, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'lose', 'user', '2025-05-11 12:08:36'),
(2, 'Алла', 'allasuper@example.com', '$2b$10$/g8IDSay4U8eH.7iQhlAsu4pcn0H1huJjq9vxBXnOIRydtbxIbO6O', 70, 175, 25, 'female', 'light', 'mifflin_st_jeor', NULL, NULL, 1508, 2073, 1573, 'lose', 'admin', '2025-05-11 12:26:23'),
(3, 'Alma', 'alma@example.com', '$2b$10$2K3dEi/lcBke9wEnJaTqz.8gsIQh4naIQW4Uo/gABTchHjpzz2OXu', 99, 179, 49, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'lose', 'user', '2025-05-12 10:17:13'),
(4, 'Alla Bugatti', 'losiha@example.com', '$2b$10$m42Zecf7ZkpsYhSiAs8teep3aXW/dxvgwVU5Se6vx92dYiARNp0QW', 23, 231, 23, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'gain', 'user', '2025-05-12 19:12:31'),
(5, 'Зинаида', 'zinar@example.com', '$2b$10$cMh5h6fH8I9BU0TydTLkG.Twa3DIy0eJ1Yy.X5TTHMQTayC5FCx1e', 67, 167, 23, NULL, 'sedentary', 'mifflin_st_jeor', NULL, NULL, NULL, NULL, NULL, 'lose', 'user', '2025-05-21 10:08:06'),
(6, 'Sabrina Glevissig', 'sabrina@example.com', '$2b$10$YvhMAjuO6LseiHmCMim3tuy9OvHQlpdldmfXN76G/shkhRXt1bdY.', 76, 168, 21, 'female', 'moderate', 'mifflin_st_jeor', NULL, NULL, 1544, 2393, 1893, 'lose', 'user', '2025-05-27 16:33:00');

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

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Achievement`
--
ALTER TABLE `Achievement`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `AchievementProgress`
--
ALTER TABLE `AchievementProgress`
  ADD KEY `achievement_id` (`achievement_id`),
  ADD KEY `user_progress_id` (`user_progress_id`);

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
  ADD KEY `fk_product_cat` (`category_id`);

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
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `UserProgress`
--
ALTER TABLE `UserProgress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Achievement`
--
ALTER TABLE `Achievement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `ExerciseDefinition`
--
ALTER TABLE `ExerciseDefinition`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `meal`
--
ALTER TABLE `meal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `MealProduct`
--
ALTER TABLE `MealProduct`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `PhysicalActivity`
--
ALTER TABLE `PhysicalActivity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `Recipe`
--
ALTER TABLE `Recipe`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `RecipeIngredient`
--
ALTER TABLE `RecipeIngredient`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `UserProgress`
--
ALTER TABLE `UserProgress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `AchievementProgress`
--
ALTER TABLE `AchievementProgress`
  ADD CONSTRAINT `achievementprogress_ibfk_1` FOREIGN KEY (`achievement_id`) REFERENCES `Achievement` (`id`),
  ADD CONSTRAINT `achievementprogress_ibfk_2` FOREIGN KEY (`user_progress_id`) REFERENCES `UserProgress` (`id`);

--
-- Constraints for table `ExerciseDefinition`
--
ALTER TABLE `ExerciseDefinition`
  ADD CONSTRAINT `fk_ex_created_by` FOREIGN KEY (`created_by`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `meal`
--
ALTER TABLE `meal`
  ADD CONSTRAINT `meal_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`);

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
  ADD CONSTRAINT `fk_product_cat` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`);

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
-- Constraints for table `UserProgress`
--
ALTER TABLE `UserProgress`
  ADD CONSTRAINT `userprogress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

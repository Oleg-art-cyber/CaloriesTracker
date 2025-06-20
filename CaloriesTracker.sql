-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 12, 2025 at 12:33 PM
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
-- Table structure for table `Meal`
--

CREATE TABLE `Meal` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `meal_datetime` datetime DEFAULT NULL,
  `meal_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MealProduct`
--

CREATE TABLE `MealProduct` (
  `meal_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_amount` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PhysicalActivity`
--

CREATE TABLE `PhysicalActivity` (
  `id` int(11) NOT NULL,
  `user_progress_id` int(11) DEFAULT NULL,
  `activity_date` date DEFAULT NULL,
  `activity_type` varchar(100) DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `calories_burned` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(5, 'Test food', 100, 1, 5, 10, 3, NULL, 1),
(6, 'Test food 2', 65, 23, 2, 2, 18, NULL, 1),
(7, 'Test food', 213, 23, 21, 213, 10, 2, 1),
(8, 'Альма тест ', 123, 3, 2, 4, 10, 3, 0);

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
  `goal` varchar(100) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `User`
--

INSERT INTO `User` (`id`, `name`, `email`, `password`, `weight`, `height`, `age`, `goal`, `role`, `created_at`) VALUES
(1, 'Oliver', 'oleg@example.com', '$2b$10$XwpwQZxljmNbxefMIoklzuuofrGmDHci29cojcVf2d2D2Eu2dyz6O', 74, 175, 28, 'lose', 'user', '2025-05-11 12:08:36'),
(2, 'Алла', 'allasuper@example.com', '$2b$10$/g8IDSay4U8eH.7iQhlAsu4pcn0H1huJjq9vxBXnOIRydtbxIbO6O', 50, 155, 22, 'lose', 'admin', '2025-05-11 12:26:23'),
(3, 'Alma', 'alma@example.com', '$2b$10$2K3dEi/lcBke9wEnJaTqz.8gsIQh4naIQW4Uo/gABTchHjpzz2OXu', 99, 179, 49, 'lose', 'user', '2025-05-12 10:17:13');

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
-- Indexes for table `Meal`
--
ALTER TABLE `Meal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `MealProduct`
--
ALTER TABLE `MealProduct`
  ADD PRIMARY KEY (`meal_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `PhysicalActivity`
--
ALTER TABLE `PhysicalActivity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_progress_id` (`user_progress_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_product_cat` (`category_id`);

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
-- AUTO_INCREMENT for table `Meal`
--
ALTER TABLE `Meal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `PhysicalActivity`
--
ALTER TABLE `PhysicalActivity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
-- Constraints for table `Meal`
--
ALTER TABLE `Meal`
  ADD CONSTRAINT `meal_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`);

--
-- Constraints for table `MealProduct`
--
ALTER TABLE `MealProduct`
  ADD CONSTRAINT `mealproduct_ibfk_1` FOREIGN KEY (`meal_id`) REFERENCES `Meal` (`id`),
  ADD CONSTRAINT `mealproduct_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`);

--
-- Constraints for table `PhysicalActivity`
--
ALTER TABLE `PhysicalActivity`
  ADD CONSTRAINT `physicalactivity_ibfk_1` FOREIGN KEY (`user_progress_id`) REFERENCES `UserProgress` (`id`);

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `fk_product_cat` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`);

--
-- Constraints for table `UserProgress`
--
ALTER TABLE `UserProgress`
  ADD CONSTRAINT `userprogress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

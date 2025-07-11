# Changelog

## Version 0.9.3.1

### Bug Fixes
- **Fixed Exercise Editing Issue**: Corrected SQL query in exercise controller that was causing "Unknown column 'u.username'" error
  - Changed `u.username as creator_name` to `u.name as creator_name` in `getOneExercise` function
  - This fixes the issue where admins and users couldn't edit exercises due to database column mismatch
  - Affected file: `server/src/controllers/exercise.js`

### Technical Improvements
- Fixed database column reference in User table JOIN queries
- Improved error handling for exercise management operations
- Enhanced exercise editing functionality for all user roles

## Version 0.9.3

### Major Changes
- Enhanced AdviceBox with server-side advice generation
- Added dynamic advice system that adapts to user actions
- Improved advice personalization based on user profile and diary data
- Added support for user-defined target calories in advice calculations

### Frontend Changes
- Updated AdviceBox component to fetch advice from server via API
- Added loading states and error handling for advice requests
- Improved user experience with fallback messages when advice is unavailable
- Enhanced advice display with better styling and animations

### Backend Changes
- Created new advice engine system (`server/src/utils/adviceEngine.js`)
- Added advice controller and routes (`/api/advice`)
- Implemented comprehensive advice bank with 40+ dynamic advice rules
- Added support for user-defined target calories override
- Enhanced advice filtering based on user actions (fruits, vegetables, protein variety, etc.)

### New Features
- **Dynamic Advice System**: Advice changes based on what user has eaten
- **Contextual Praise**: System praises users for good choices (e.g., adding fruits/vegetables)
- **Goal-Specific Advice**: Tailored advice for weight loss, gain, and maintenance goals
- **Activity-Based Advice**: Post-workout nutrition suggestions
- **Meal Timing Analysis**: Advice based on meal patterns and timing
- **Nutritional Balance Detection**: Praise for balanced macronutrient intake

### Technical Improvements
- Professional English documentation and comments
- Robust error handling in advice generation
- Optimized advice filtering and sorting by priority
- Enhanced code maintainability and readability

### Documentation
- Updated changelog with version 0.9.3 information
- Added comprehensive JSDoc documentation for advice engine
- Improved code comments and structure

## Version 0.9.2

### Major Changes
- Updated all package.json files to version 0.9.2
- Improved version management across client and server
- Enhanced project structure and documentation

### Frontend Changes
- Updated client package.json version to 0.9.2
- Improved version consistency across the application

### Backend Changes
- Updated server package.json version to 0.9.2
- Enhanced version tracking in backend services

### Documentation
- Updated changelog with version 0.9.2 information
- Improved version management documentation

## Version 8.1

### Major Changes
- Fixed date handling in statistics charts
- Improved weight trend data processing
- Enhanced error handling and logging
- Added comprehensive API documentation

### Frontend Changes
- Fixed date selection in StatisticsPage
- Improved chart axis labels
- Enhanced date formatting and validation
- Added better error messages

### Backend Changes
- Fixed SQL queries for date ranges
- Improved weight trend data processing
- Enhanced error handling in statistics controller
- Added detailed logging for debugging

### Database Changes
- Optimized date handling in queries
- Improved data consistency checks

### Security
- Enhanced input validation
- Improved error handling
- Added request logging

### Documentation
- Added comprehensive API documentation
- Enhanced code comments
- Added changelog

## [v0.6.0]


This version introduces a comprehensive Achievements system, an enhanced User Profile page, and integrates physical activity tracking more deeply into the Daily Diary. Numerous bug fixes and improvements have also been implemented across the application.

### ✨ Features

*   **User Profile Management:**
    *   Implemented a new "Profile" page (`/profile`) allowing users to view and update their personal information.
    *   Users can now edit their name, email, weight, height, age, primary goal (lose, gain, maintain), gender, and general activity level.
    *   Backend API endpoints (`GET /api/profile`, `PUT /api/profile`) created to support fetching and updating profile data.
    *   Database: Added `gender` (ENUM) and `activity_level` (ENUM) columns to the `User` table.

*   **Achievements System:**
    *   Introduced a new "Achievements" page (`/achievements`) to display all available achievements and track user progress.
    *   Achievements are grouped by category (e.g., Getting Started, Consistency, Nutrition, Activity).
    *   Visual distinction between earned and locked achievements using an `AchievementBadge` component with Font Awesome icons.
    *   Backend API (`GET /api/achievements`) now fetches all achievement definitions and indicates which ones the current user has earned, along with the date achieved.
    *   Implemented server-side logic (`checkAndAwardAchievements` controller function) to evaluate and award achievements based on user actions.
        *   Initial achievement checks implemented for: first meal logged, number of recipes created, profile completion, and daily calories burned from exercise.
    *   Database: Created `AchievementDefinition` table for storing achievement details (name, description, icon, criteria, points) and `UserAchievement` table to track earned achievements per user.

*   **Diary Enhancements:**
    *   **Physical Activity Integration:**
        *   Users can now log physical activities via an "Add Activity Modal" on the Diary page.
        *   Logged activities are displayed on the Diary page, showing exercise name, duration, and calories burned.
        *   The daily `SummaryBox` now includes "Calories Burned (Exercise)" and "Net Calories" (Consumed - Burned).
        *   Backend: `GET /api/diary` now includes logged physical activities and updated summary. `POST /api/physical-activity` and `DELETE /api/physical-activity/:id` endpoints implemented for managing activities.
        *   Database: `PhysicalActivity` table schema updated to link directly to `User` via `user_id` for simpler logic.
    *   **Personalized Advice System:**
        *   Integrated an `AdviceBox` component into the Diary page.
        *   Displays contextual tips (~40 available) based on the user's profile data and daily diary entries (nutrition, activity).
        *   Advice is prioritized, with 1-2 primary tips shown initially and an option to expand for more.
        *   Tips are styled based on type (warning, suggestion, praise, info) with relevant emojis.
        *   Includes a helper function to estimate target calories based on user profile (Mifflin-St Jeor).

### 🐛 Bug Fixes & Improvements

*   **Client-Side Routing & Modals:**
    *   Resolved `TypeError: Cannot read properties of undefined (reading 'charAt')` in modal components (`AddItemModal`, `RecipeForm`) by ensuring correct prop names (`type` vs. `mealType`) were consistently passed and expected.
    *   Addressed and clarified the distinction and proper usage of `AddItemModal.jsx` (for adding food to diary) and `RecipeForm.jsx` (for creating/editing recipe definitions).
*   **Network & API Requests:**
    *   Fixed `net::ERR_INSUFFICIENT_RESOURCES` and `AxiosError: Network Error` by correcting Vite proxy configuration in `vite.config.js` (ensuring `changeOrigin: true` is used) and by reducing default data load limits for testing (recommending server-side search/pagination for large lists like products).
    *   Stabilized `useEffect` hooks responsible for data fetching in various components (e.g., `AddItemModal`, `RecipeForm`) to prevent infinite request loops by refining dependency arrays and adding "loaded" flags.
*   **Server-Side SQL & Logic:**
    *   Corrected `ER_BAD_FIELD_ERROR: Unknown column 'pa.user_id'` in `

## [0.9.4] - 2025-01-20

### Added
* **Expanded Achievement System**: Completely redesigned achievement system with 28 achievements across 7 categories
  * **Getting Started (4 achievements)**: First meal logged, account creation, first activity, goal setting
  * **Consistency (4 achievements)**: 7, 14, and 30-day food tracking streaks, 7-day activity streak
  * **Nutrition (4 achievements)**: Protein targets, calorie balance, macro mastery, food variety
  * **Activity (4 achievements)**: Daily calorie burn milestones, endurance workouts, weekly exercise goals
  * **Foodie (4 achievements)**: Recipe creation milestones, meal planning, using own recipes
  * **Profile (4 achievements)**: Profile completion, data updates, weight tracking milestones
  * **Habits (4 achievements)**: Early breakfast, consistent meal times, complete meal logging
* **Enhanced Achievement Logic**: Comprehensive server-side achievement checking with 20+ different criteria types
  * Consecutive day tracking for food, activity, and weight logging
  * Macro and calorie target achievement checking
  * Recipe creation and usage tracking
  * Meal timing and variety analysis
  * Profile completion and update detection
* **Real-time Achievement Awarding**: Achievements are now checked and awarded automatically when users:
  * Log meals and activities
  * Create recipes
  * Update profiles
  * Log weight entries
  * Load diary data

### Technical Improvements
* **Robust Achievement Controller**: Expanded `checkAndAwardAchievements` function with 20+ achievement types
* **Helper Functions**: Added specialized functions for consecutive day calculations, macro analysis, and meal pattern detection
* **Database Integration**: All achievement checks use real database data (no placeholder achievements)
* **Error Handling**: Comprehensive error handling for achievement checking with detailed logging
* **Performance**: Asynchronous achievement checking to avoid blocking user actions

### Database Changes
* Updated `AchievementDefinition` table with 28 new realistic achievements
* All achievements based on actual available data (no water/hydration tracking)
* Proper categorization and point allocation system
* Updated AUTO_INCREMENT to 29

### Files Modified
* `server/src/controllers/achievements.js` - Complete rewrite with 20+ achievement types
* `server/src/controllers/physicalActivity.js` - Added achievement checking
* `server/src/controllers/recipes.js` - Added achievement checking
* `server/src/controllers/profile.js` - Added achievement checking for profile updates and weight logging
* `CaloriesTracker-13.sql` - Updated with new achievement definitions
* `achievements_insert.sql` - New SQL file for local database updates

## [0.9.3] - 2025-01-20
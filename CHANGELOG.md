# Changelog

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
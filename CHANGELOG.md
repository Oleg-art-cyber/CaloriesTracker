# Changelog

# Changelog

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
    *   Corrected `ER_BAD_FIELD_ERROR: Unknown column 'pa.user_id'` in `diaryController.js` by updating the SQL query for physical activities to use the new direct `user_id` link after schema modification.
    *   Resolved `ER_BAD_FIELD_ERROR: Unknown column 'ad.is_earned' in 'order clause'` in `achievementsController.js` by rewriting the SQL `ORDER BY` clause to use the full `CASE` expression instead of its alias.
    *   Ensured `dbSingleton` usage is compatible with `async/await` in `achievementsController.js` by implementing a promisified query helper (`queryAsync`).
*   **Database Schema:**
    *   Successfully refactored the `MealProduct` table to include a surrogate `id` primary key and support linking to both individual products and recipes. Resolved `errno: 150 "Foreign key constraint is incorrectly formed"` errors during `ALTER TABLE` operations by correctly sequencing `DROP/ADD` of keys and constraints.
*   **User Experience:**
    *   Implemented scroll position preservation on the `Diary.jsx` page after adding/editing/deleting items or activities to prevent the page from scrolling to the top.
    *   Added `React.memo` to several components (`MealCard`, `LoggedActivityItem`, `AchievementBadge`) for potential rendering performance improvements.

### 🏠 Housekeeping

*   Updated `app.js` (server) for clearer middleware order and mounting of new routes.
*   Added new routes and navigation links for Profile and Achievements pages in `App.jsx` and `Navbar.jsx` (client).
*   Standardized English-only, concise code comments.

## [0.5.2] - 2025-05-21
Backend (server):
- Added Recipe & RecipeIngredient tables.
- Modified MealProduct table for recipe linkage and surrogate PK.
- Created /api/recipes CRUD endpoints.
- Updated Diary controller (/api/diary) for recipe logging & nutritional calculation.
- Adapted diary item PATCH/DELETE to use MealProduct.id.

Frontend (client):
- Added 'My Recipes' page (MyRecipes.jsx) for recipe CRUD.
- Created 'RecipeForm.jsx' modal with ingredient search & management.
- Updated 'AddItemModal.jsx' for selecting/adding both products and recipes.
- Updated 'MealCard.jsx' & 'MealItemRow.jsx' for displaying products/recipes and using MealProduct.id.
- Added 'My Recipes' navigation link.
- Resolved 'charAt' error by correcting prop usage in modals.
- Addressed 'ERR_INSUFFICIENT_RESOURCES' with recommendations (temporary client-side limit applied for testing).
- Improved Vite proxy configuration.

Database:
- Applied ALTER TABLE statements to MealProduct.
- Created Recipe and RecipeIngredient tables.

## [0.4.9] – 2025-05-18
### Added
   * Search field with debounce (client & server)
   * Pagination (page, limit, total) in API and UI
   * Category badge and dynamic select
   Fixed
   * Consistent Axios auth headers, error handling
 ----------------------------------

## [0.4.1.5] – 2025-05-12
### Fixed
- Cast `created_by` and `req.user.id` to `Number` in ownership middleware  
- Allow **admin** to bypass ownership check  
- Enforce ownership check **after** auth in `PUT` & `DELETE` product routes  

## [v0.4.0.1] – 2025-05-12 - Category refactor

### Added
* reference table **category** with 27 predefined records
* default fallback to **OTHER** (FK + Joi `.default`)
* new endpoint `GET /api/categories`
* dynamic category `<select>` in ProductForm (React)

### Changed
* `product` now stores **category_id** (FK) instead of free-text field
* all CRUD SQL & Joi schemas updated
* Products list shows human-readable `category` label

### SQL
- Now information about category save in other table and coonect to products as FK

## [0.2.0] – 2025-05-**  
### Added  
- User registration & login  
- JWT tokens (7-day expiry)  
- Role-based guard (`admin` required for POST/PUT/DELETE)  
- Joi validation for product payloads  

## [0.1.0] – 2025-05-**  
### Added  
- Product CRUD (GET/POST/PUT/DELETE)  
- Project structure (server/src/…)  


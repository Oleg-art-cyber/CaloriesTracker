# Changelog

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


# Changelog

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


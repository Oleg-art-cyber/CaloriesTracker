# Changelog

## v0.4.0.1 – Category refactor

### Added
* reference table **category** with 27 predefined records
* default fallback to **OTHER** (FK + Joi `.default`)
* new endpoint `GET /api/categories`
* dynamic category `<select>` in ProductForm (React)

### Changed
* `product` now stores **category_id** (FK) instead of free-text field
* all CRUD SQL & Joi schemas updated
* Products list shows human-readable `category` label

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


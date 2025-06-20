## Core features (v0.6)

| # | Feature | Status | Source |
|---|---------|--------|--------|
| 1 | **Login with JWT** | ✅ | P1.2 :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1} |
| 2 | Food diary CRUD (meals) |  ✅ | P2 / P2.1 / P2.2 |
| 3 | Daily calorie calculator |  ✅  | 003-UC |
| 4 | Activity log & calories burned |  ✅  | Req-4 |
| 5 | Progress stats & charts |  ✅  | 007-UC |
| 6 | Product catalog CRUD | ✅ | Req-6 / Req-7 |
| 7 | Admin user management | ✅ | P5.1 |
| 8 | Personalised recommendations |  ✅  | P6 |
| 9 | Achievements & badges |  ✅  | P6.1 |
|10 | Security (HTTPS, GDPR options) | ⚙︎ ongoing | Sec-4-8 |

---

API 
Method	Endpoint	Auth	Note/Description
POST	/api/auth/register	public	Register new user, returns JWT
POST	/api/auth/login	public	Login, returns JWT
GET	/api/categories	public	Get all product categories
GET	/api/products	user, admin	List all public or owned products
GET	/api/products/:id	user, admin	Get product by ID
POST	/api/products	user, admin	Create product (user or admin)
PUT	/api/products/:id	user, admin	Update product (admin or owner)
DELETE	/api/products/:id	user, admin	Delete product (admin or owner)
GET	/api/diary/:type	user, admin	Get diary entries by meal type
POST	/api/diary/:type	user, admin	Add meal entry
GET	/api/achievements	user, admin	Get all achievements for user
GET	/api/profile	user, admin	Get user profile
PUT	/api/profile	user, admin	Update user profile
GET	/api/statistics	user, admin	Get user statistics
GET	/api/exercise/:id	user, admin	Get exercise by ID
GET	/api/physical-activity	user, admin	Get all physical activities for user
POST	/api/physical-activity	user, admin	Add physical activity
GET	/api/recipes	user, admin	Get all recipes for user
POST	/api/recipes	user, admin	Create new recipe
PUT	/api/recipes/:id	user, admin	Update recipe
DELETE	/api/recipes/:id	user, admin	Delete recipe
GET	/api/users	admin	List all users (admin only)
GET	/api/admin/statistics	admin	Get admin dashboard statistics
GET	/api/admin/users	admin	List all users (admin management)
PUT	/api/admin/users/:id	admin	Update user (admin management)
DELETE	/api/admin/users/:id	admin	Delete user (admin management)

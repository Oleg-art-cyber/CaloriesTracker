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
# API Reference (v0.9.0)

> All responses are in JSON format.  
> `public` — no authentication required.  
> `user, admin` — requires JWT; user can access their own data, admin can access everything.  
> `admin` — only accessible by administrators.

---

## 1. Authentication

| Method | Endpoint              | Access | Description                      |
|--------|-----------------------|--------|----------------------------------|
| POST   | `/api/auth/register`  | public | Register new user, returns JWT   |
| POST   | `/api/auth/login`     | public | Login user, returns JWT          |

---

## 2. Categories & Products

| Method | Endpoint                     | Access      | Description                                         |
|--------|------------------------------|-------------|-----------------------------------------------------|
| GET    | `/api/categories`            | public      | Get all product categories                          |
| GET    | `/api/products`              | user, admin | List all public or user-owned products              |
| GET    | `/api/products/:id`          | user, admin | Get product by ID                                   |
| POST   | `/api/products`              | user, admin | Create a new product                                |
| PUT    | `/api/products/:id`          | user, admin | Update a product (owner or admin only)              |
| DELETE | `/api/products/:id`          | user, admin | Delete a product (owner or admin only)              |

---

## 3. Meal Diary

| Method | Endpoint               | Access      | Description                               |
|--------|------------------------|-------------|-------------------------------------------|
| GET    | `/api/diary/:type`     | user, admin | Get meal entries by meal type             |
| POST   | `/api/diary/:type`     | user, admin | Add a meal entry                          |

---

## 4. Achievements & Profile

| Method | Endpoint              | Access      | Description                      |
|--------|-----------------------|-------------|----------------------------------|
| GET    | `/api/achievements`   | user, admin | Get all achievements for user    |
| GET    | `/api/profile`        | user, admin | Get user profile                 |
| PUT    | `/api/profile`        | user, admin | Update user profile              |

---

## 5. User Statistics

| Method | Endpoint            | Access      | Description               |
|--------|---------------------|-------------|----------------------------|
| GET    | `/api/statistics`   | user, admin | Get user statistics        |

---

## 6. Exercises & Physical Activity

| Method | Endpoint                         | Access      | Description                           |
|--------|----------------------------------|-------------|----------------------------------------|
| GET    | `/api/exercise/:id`             | user, admin | Get exercise by ID                     |
| GET    | `/api/physical-activity`        | user, admin | Get all user physical activities       |
| POST   | `/api/physical-activity`        | user, admin | Add new physical activity              |

---

## 7. Recipes

| Method | Endpoint              | Access      | Description                  |
|--------|-----------------------|-------------|------------------------------|
| GET    | `/api/recipes`        | user, admin | Get all user recipes         |
| POST   | `/api/recipes`        | user, admin | Create a new recipe          |
| PUT    | `/api/recipes/:id`    | user, admin | Update a recipe              |
| DELETE | `/api/recipes/:id`    | user, admin | Delete a recipe              |

---

## 8. Admin Panel

| Method | Endpoint                    | Access | Description                                |
|--------|-----------------------------|--------|--------------------------------------------|
| GET    | `/api/users`                | admin  | List all users                              |
| GET    | `/api/admin/statistics`     | admin  | Get admin dashboard statistics              |
| GET    | `/api/admin/users`          | admin  | Manage user list (admin panel)              |
| PUT    | `/api/admin/users/:id`      | admin  | Update user info as admin                   |
| DELETE | `/api/admin/users/:id`      | admin  | Delete user as admin                        |

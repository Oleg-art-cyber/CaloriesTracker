## Core features (v0.6)

| # | Feature | Status | Source |
|---|---------|--------|--------|
| 1 | **Login with JWT** | ✅ | P1.2 :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1} |
| 2 | Food diary CRUD (meals) |  ✅ | P2 / P2.1 / P2.2 |
| 3 | Daily calorie calculator |  ✅  | 003-UC |
| 4 | Activity log & calories burned |  ✅  | Req-4 |
| 5 | Progress stats & charts |  planned  | 007-UC |
| 6 | Product catalog CRUD | ✅ | Req-6 / Req-7 |
| 7 | Admin user management | planned | P5.1 |
| 8 | Personalised recommendations |  ✅  | P6 |
| 9 | Achievements & badges |  ✅  | P6.1 |
|10 | Security (HTTPS, GDPR options) | ⚙︎ ongoing | Sec-4-8 |

---

## API (v0.4)

| Method | Endpoint | Auth | Note |
|--------|----------|------|------|
| POST | `/api/auth/login` | public | returns JWT |
| GET  | `/api/categories` | public | category list |
| GET  | `/api/products` | public | all products |
| POST | `/api/products` | **admin** | create product |
| PUT  | `/api/products/:id` | **admin** | update product |
| DELETE | `/api/products/:id` | **admin** | remove product |

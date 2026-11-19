# Announcements Board REST API

A pure JSON REST API for an announcements board, built as a Node.js course assignment.

Anonymous visitors can browse and view announcements. Registered users can create announcements and edit or delete only their own.

## Features

- Registration and login with bcrypt password hashing
- JWT authentication: access token (15 minutes) + refresh token (7 days)
- Refresh token rotation: every refresh deletes the old token and stores a new one
- Announcements CRUD with ownership checks (403 for someone else's announcement)
- Search (case-insensitive), sorting and pagination (10 per page)
- Request validation with Zod (body, params, query)
- OpenAPI documentation with Swagger UI at `/api-docs`

## Tech stack

| Technology | Purpose |
| --- | --- |
| Node.js 22 + TypeScript | Runtime and language |
| Express 5 | Web framework |
| Prisma 7 + PostgreSQL 16 | ORM and database |
| Zod | Input validation |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication |
| @asteasolutions/zod-to-openapi + swagger-ui-express | API documentation |
| Docker | Local PostgreSQL |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL in Docker

```bash
docker run --name postgres-hw -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=announcements -p 5432:5432 -v postgres-hw-data:/var/lib/postgresql/data -d postgres:16
```

Next time just run `docker start postgres-hw`.

### 3. Configure environment variables

Copy `.env.example` to `.env` and set your own `JWT_SECRET` (a long random string):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/announcements?schema=public"
JWT_SECRET="your_secret_key_here"
```

### 4. Apply migrations and generate Prisma Client

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 5. (Optional) Add demo data

```bash
npm run seed
```

Creates a demo user (`ivan_petrenko` / `secret123`) and 12 announcements, enough to see pagination.

### 6. Run the server

```bash
npm run dev
```

- API: http://localhost:3000
- Documentation: http://localhost:3000/api-docs

## Endpoints

### Auth

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Log in | No |
| POST | `/auth/refresh` | Get a new token pair (rotation) | No |
| POST | `/auth/logout` | Log out (refresh token is deleted) | Yes |
| GET | `/auth/me` | Current user profile | Yes |

### Announcements

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| GET | `/announcements` | List with search, sorting and pagination | No |
| GET | `/announcements/:id` | One announcement with author | No |
| POST | `/announcements` | Create (author is taken from the token) | Yes |
| PATCH | `/announcements/:id` | Partial update (owner only) | Yes |
| DELETE | `/announcements/:id` | Delete (owner only) | Yes |

Protected routes require the header `Authorization: Bearer <accessToken>`.

### GET /announcements query parameters

| Parameter | Description |
| --- | --- |
| `search` | Case-insensitive search in `title` |
| `sort` | `newest` (default) or `oldest` |
| `page` | Page number (integer > 0), 10 records per page |

## Validation rules

**POST /auth/register**

| Field | Rules |
| --- | --- |
| `username` | string, 3-30 characters |
| `email` | valid email |
| `password` | string, at least 6 characters |
| `name` | string, at least 2 characters |

**POST /announcements**

| Field | Rules |
| --- | --- |
| `title` | string, 5-50 characters |
| `description` | string, at least 10 characters |
| `price` | number > 0 |
| `category` | one of `sale`, `service`, `job`, `other` |

`PATCH /announcements/:id` uses the same rules, but every field is optional. An empty body `{}` is rejected.

## Status codes

| Code | When |
| --- | --- |
| 200 / 201 / 204 | Success |
| 400 | Validation failed |
| 401 | Missing, invalid or expired token; invalid credentials |
| 403 | Trying to change someone else's announcement |
| 404 | Record or route not found |
| 409 | Username or email already taken |

## Testing

- Swagger UI at `/api-docs`: log in, press **Authorize**, paste the `accessToken`.
- `test.http` for the VS Code REST Client extension: send the requests from top to bottom.

## Project structure

```
├── prisma/
│   ├── schema.prisma          # User, RefreshToken, Announcement models
│   ├── client.ts              # Prisma Client with PostgreSQL adapter
│   └── migrations/
├── src/
│   ├── controllers/           # Route handlers (business logic)
│   ├── middleware/            # authenticate, validateBody/Params/Query
│   ├── routes/                # Express routers + OpenAPI path registration
│   ├── validators/            # Zod schemas for requests and responses
│   └── openapi.ts             # OpenAPI registry and bearerAuth scheme
├── app.ts                     # Express app entry point
├── seed-announcements.ts      # Optional demo data
├── test.http                  # Manual API tests
├── .env.example
└── prisma.config.ts
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with hot reload (`tsx --watch`) |
| `npm start` | Start without watch mode |
| `npm run prisma:migrate` | Create and apply migrations |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run seed` | Add demo user and announcements |

## License

ISC
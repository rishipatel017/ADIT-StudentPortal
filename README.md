# ADIT Campus ERP (ADIT_CampusHub)

A role-based ERP system for managing an IT department’s academic workflows.

- **Admin**: manage academic structure and users
- **Faculty**: attendance, assignments, marks, notices
- **Student**: view subjects, attendance, assignments, marks, notices

## Tech Stack

- **Frontend**: Next.js (React 18, TypeScript), Tailwind CSS
- **Backend**: NestJS (TypeScript), Prisma ORM
- **Database**: MySQL (Prisma datasource is `mysql`)
- **Auth**: JWT (role-based access control)

## Monorepo Structure

- `backend/` NestJS API + Prisma
- `frontend/` Next.js web app
- `docker-compose.yml` local containers (includes Postgres service; see notes below)

## Prerequisites

- Node.js 18+ recommended
- npm
- A running database server
  - **Recommended**: MySQL (matches `backend/prisma/schema.prisma`)

## Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` using `backend/.env.example`.

Key variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT` (default `3001`)
- `UPLOAD_DIR` (default `./uploads`)

### Frontend (`frontend/.env.local`)

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Local Development (Recommended)

### 1) Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2) Configure database

Update `backend/.env`:

- For MySQL:
  - `DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"`

### 3) Prisma setup (migrate + seed)

```bash
cd backend
npm run db:setup
```

### 4) Run the apps

```bash
# Backend
cd backend
npm run start:dev
```

Backend:
- `http://localhost:3001`
- Swagger (if enabled): `http://localhost:3001/api`

```bash
# Frontend
cd frontend
npm run dev
```

Frontend:
- `http://localhost:3000`

## Default Seed Credentials

After `npm run db:setup` (seed):

- **Admin**
  - Email: `admin@itcollege.edu`
  - Password: `admin123`

- **Faculty**
  - Email: `hod@itcollege.edu`
  - Password: `faculty123`

- **Student**
  - Email: `rahul@itcollege.edu`
  - Password: `student123`

## Attachments / Uploads

File uploads (assignments/notices) are stored under `uploads/` and are served by the backend at:

- `GET /uploads/...`

In development, keep the uploads folder outside Git (already ignored in `.gitignore`).

## Docker

This repo includes:

- `docker-compose.yml`
- `docker-compose.optimized.yml`

Important note:

- `backend/prisma/schema.prisma` is configured for **MySQL**.
- `docker-compose.yml` provisions **PostgreSQL**.

If you plan to use Docker for local/dev/prod, align these by either:

- switching Prisma datasource to `postgresql`, **or**
- changing the compose file to run MySQL.

## Scripts

### Backend

From `backend/`:

- `npm run start:dev` development server
- `npm run build` build
- `npm run start:prod` run production build
- `npm run db:setup` generate + migrate + seed
- `npm run prisma:studio` Prisma UI

### Frontend

From `frontend/`:

- `npm run dev` development server
- `npm run build` build
- `npm run start` start production server
- `npm run test:e2e` Playwright E2E tests

## Deployment

See `DEPLOYMENT_GUIDE.md` for deployment notes and production build steps.

## License


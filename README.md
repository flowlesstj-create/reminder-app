# Reminder App (Next.js + TypeScript + Sequelize + SQLite)

A full reminder app with:

- Account creation and login
- Session-based auth (HTTP-only cookie)
- Dashboard to create, edit, complete, and delete reminders
- Notes and optional reminder date/time
- Share reminder by public link

## Tech Stack

- Next.js (App Router)
- TypeScript
- Sequelize ORM
- SQLite (`data/app.sqlite`)
- Tailwind CSS

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## App Flow

1. User signs up or logs in at `/signup` or `/login`.
2. Successful auth creates a server session and redirects to `/dashboard`.
3. Dashboard allows reminder CRUD + share link generation.
4. Shared link opens `/shared/[token]` for read-only viewing.

## API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/reminders`
- `POST /api/reminders`
- `PATCH /api/reminders/:id`
- `DELETE /api/reminders/:id`
- `POST /api/reminders/:id/share`

## Notes

- SQLite DB file is stored at `data/app.sqlite`.
- Session tokens are persisted in DB table `sessions`.
- Passwords are hashed with `bcryptjs`.

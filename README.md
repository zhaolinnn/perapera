# perapera

A simple social media app built with:

- React + Vite + TailwindCSS (client)
- Node.js + Express + Passport (server)
- PostgreSQL (database)

### Running locally

- **1. Install dependencies**

```bash
cd perapera
npm install
```

- **2. Set up Postgres**

Create a database (for example `perapera`) and run the SQL in `server/sql/schema.sql` against it.

Set your connection string in an `.env` file in `server`:

```bash
cd server
cp .env.example .env   # or create manually if example is missing
```

Then edit `.env` to set:

- `DATABASE_URL` – Postgres connection string
- `SESSION_SECRET` – any random string
- `PORT` – usually `4000`

- **3. Run the dev servers**

From the repo root:

```bash
npm run dev
```

This will start:

- **Backend**: `http://localhost:4000`
- **Frontend**: `http://localhost:5173`

Open `http://localhost:5173` in your browser to sign up, log in, and create posts.

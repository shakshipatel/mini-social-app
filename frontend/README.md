Frontend (Vite + React)

This frontend reads its API base URL from an environment variable named `VITE_API_URL`.

Setup

1. Copy `frontend/.env.example` to `frontend/.env` and update the URL if your backend is not running at the default.

2. Install and run:

```bash
npm install
npm run dev
```

By default `VITE_API_URL` in the example points to `http://localhost:4000/api`. You can also set the env var inline when starting Vite:

```bash
export VITE_API_URL='http://localhost:4000/api'
npm run dev
```

Notes

- Do not commit your local `.env` — `frontend/.gitignore` includes `.env`.
- Environment variables used by Vite must be prefixed with `VITE_` to be exposed to the client.

The frontend supports register/login, token storage (localStorage), viewing the feed, and creating posts.

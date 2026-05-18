# Gym Review — full-stack assignment project

This folder is a **complete course-style solution**: a small **Gym Review REST API** (Node / Express), a **React** SPA (Vite), **Firebase Authentication**, automated **Vitest** tests, and a **GitHub Actions** workflow. It was built for a “testing and authentication” assignment: emphasis on **401 on protected routes**, **CORS**, **no secrets in git**, and **documented security choices**.

If you are new here, read this file top to bottom once, then skim the **“Where to look in the code”** section when you open the repo.

---

## What was built (in plain language)

1. **Backend** — An Express server exposes gyms and reviews. Data lives in an **in-memory array** (no real database), which is enough for the assignment focus on auth and tests.
2. **Auth** — **Firebase**: the browser signs the user in; the client sends a **Firebase ID token** as `Authorization: Bearer <token>`. The server uses **`firebase-admin`** to verify that token on protected routes.
3. **Frontend** — Lists gyms for everyone. **Login / logout** controls access to forms that create gyms and reviews. Profile calls `/profile` when logged in.
4. **Tests** — **Five integration tests** on the API (including 401 vs 201 behaviour). **Five unit tests** on small React “presentational” components (no real network).
5. **CI** — GitHub Actions installs dependencies and runs both test suites on pushes/PRs to `main`.

---

screenshots:- Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  09:48:39
   Duration  8.45s (transform 79ms, setup 1.09s, collect 673ms, tests 35ms, environment 5.38s, prepare 399ms)

   Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  09:50:50
   Duration  1.16s (transform 63ms, setup 0ms, collect 229ms, tests 129ms, environment 0ms, prepare 332ms)



## Repository layout

```
new project/
├── README.md                 ← you are here
├── .gitignore
├── .github/
│   └── workflows/
│       └── test.yml          ← CI: backend + client tests
├── backend/
│   ├── package.json
│   ├── vitest.config.js
│   ├── .env.example          ← template (safe to commit)
│   ├── .env                  ← local secrets (NOT committed)
│   └── src/
│       ├── index.js          ← starts HTTP server (loads dotenv)
│       ├── app.js            ← Express app factory (routes, CORS, JSON)
│       ├── store.js          ← in-memory gyms + reviews
│       ├── auth.js           ← re-exports verifyIdToken (so tests can mock one module)
│       ├── firebaseAdmin.js  ← initializes Admin SDK from env / JSON file
│       ├── middleware/
│       │   └── verifyToken.js
│       └── integration.test.js
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    ├── .env                  ← local Firebase web config (NOT committed)
    └── src/
        ├── main.jsx
        ├── App.jsx           ← wires Firebase + API + UI
        ├── firebase.js       ← Firebase app + inMemoryPersistence
        ├── api.js            ← axios instance, Bearer interceptor, withCredentials
        ├── GymUI.jsx         ← small components tested in isolation
        ├── GymUI.test.jsx
        └── setupTests.js
```

---

## How it fits together (request flow)

1. User opens the **client** (`http://localhost:5173`).
2. **Public** `GET /gyms` runs without a token.
3. After **email/password login**, Firebase holds the session in memory (`inMemoryPersistence` — not `localStorage`).
4. For protected calls, `api.js` asks Firebase for a fresh **ID token** and sends `Authorization: Bearer …`.
5. The **backend** `verifyToken` middleware calls `verifyIdToken`. If missing/invalid → **401 JSON**. If OK → `req.user` is set and the route handler runs.

---

## First-time setup (new machine)

Prerequisites: **Node.js 20+** (CI uses **22.x**), **npm**, a **Firebase** project with **Email/Password** enabled and a test user.

### 1. Install dependencies

From this folder (`new project`):

```powershell
cd backend
npm install
cd ..\client
npm install
```

### 2. Environment files

- Copy `backend\.env.example` → `backend\.env`.
- Copy `client\.env.example` → `client\.env` and fill **VITE_** variables from the Firebase Console → Project settings → Your apps → Web app config.

**Backend credentials (pick one):**

| Variable | Use case |
|----------|-----------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to the downloaded **service account JSON** file. Relative paths are resolved from the **`backend`** directory when you run `npm run dev` / `npm start`. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Entire JSON as **one line** in `.env` (common in CI secrets). |

This repo was wired to **reuse** the existing Playground layout under the parent **`priti project`** folder: `backend\.env` may point at `..\..\server\firebase\firebase-service-account.local.json` so you do not duplicate the key file. Adjust the path if your folder layout differs.

### 3. Run locally

Two terminals:

```powershell
# Terminal 1 — API (default PORT in .env.example: 4000)
cd backend
npm run dev

# Terminal 2 — UI
cd client
npm run dev
```

Open **http://localhost:5173**. Ensure `client\.env` has `VITE_API_BASE_URL` matching the backend (e.g. `http://localhost:4000`).

---

## Tests — what runs and why

### Backend (`cd backend` → `npm test`)

- File: `src/integration.test.js`.
- Uses **Vitest** and Node’s **`http`** module to send real HTTP requests to the Express app **without** starting the normal server entrypoint.
- **Firebase is not called** in these tests: `vi.mock('./auth.js', …)` replaces token verification with a fake that accepts the string `valid-test-token` as “valid”.
- That keeps CI fast and avoids needing real Firebase on every assertion, while still testing **routing + middleware + store** together.

### Client (`cd client` → `npm test`)

- File: `src/GymUI.test.jsx`.
- Tests **`GymUI.jsx`** only: “not logged in” text, user greeting, hiding protected UI, gym list vs empty message.
- **No Firebase and no HTTP** — assignment-style “fake component” / props-only tests.

Scripts use **`npx vitest run`** so `npm test` works reliably on **Windows** where `vitest` might not resolve from `PATH` alone.

---

## CI (GitHub Actions)

File: `.github/workflows/test.yml`.

- Triggers on **push** and **pull_request** to **`main`**.
- Installs and tests **`backend`**, then **`client`**.
- Add a repo secret **`FIREBASE_SERVICE_ACCOUNT_JSON`** if your workflow or future tests need a real Admin credential in the cloud; do **not** paste secrets into the YAML.

---

## HTTP API reference

| Method | Path | Access | Notes |
|--------|------|--------|--------|
| GET | `/gyms` | Public | List gyms (summary fields). |
| GET | `/gyms/:id` | Public | Full gym or **404**. |
| POST | `/gyms` | Bearer ID token | Body: `{ name, address? }` → **201** or **401**. |
| POST | `/gyms/:id/reviews` | Bearer ID token | Body: `{ rating, comment? }` → **201** / **404** / **401**. |
| GET | `/profile` | Bearer ID token | Returns `{ user: { uid, email } }`. |

---

## Security behaviour (short checklist for reviewers)

- **No secrets in git** — only `.env.example`; real values in `.env` (ignored).
- **Protected routes → 401** without a valid Bearer token (asserted in integration tests).
- **CORS** — `CLIENT_ORIGIN` is a **single origin** (e.g. `http://localhost:5173`), not `*`.
- **Tokens** — client uses **`inMemoryPersistence`** so tokens are not stored in **`localStorage`**.
- **Authenticated HTTP** — axios is created with **`withCredentials: true`** and the interceptor adds **`Authorization`**.

---

## Troubleshooting

| Symptom | Things to check |
|---------|-------------------|
| `401` on every protected call after login | Backend `GOOGLE_APPLICATION_CREDENTIALS` / JSON must match the **same** Firebase project as the web app in `client/.env`. |
| CORS error in browser | `CLIENT_ORIGIN` in **backend** `.env` must exactly match the page origin (scheme + host + port). |
| `EADDRINUSE` | Another process uses the port; change `PORT` in `backend/.env` and `VITE_API_BASE_URL` in `client/.env`. |
| `npm test` says `vitest` not found | Run `npm install` in that package folder; scripts already use `npx vitest run`. |

---

## Where to look in the code (onboarding order)

1. `backend/src/app.js` — all routes and middleware order.
2. `backend/src/middleware/verifyToken.js` — how 401 is returned.
3. `client/src/api.js` — how the Bearer token is attached.
4. `client/src/App.jsx` — user-visible behaviour.
5. `backend/src/integration.test.js` — examples of how the API is exercised.

---

## Course submission reminders

Add to this README (or a linked doc) before handing in:

- **Screenshots**: local test run green; GitHub Actions run green.
- **Reflection** paragraphs: why Firebase vs Auth0, what was hard, what you would change next time.

---

## Authors

Update this section with names, course, and date when you submit.

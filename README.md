# JCAS-NARCOS — Medication Box Tracker

Full-stack web application for tracking controlled-substance medication boxes, built with React, Node.js/Express, and Firebase.

| Layer | Tech | Host |
|-------|------|------|
| Frontend | React 19 (CRA) | [GitHub Pages](https://morgang213.github.io/JCAS-NARCOS/) |
| Backend | Node.js / Express | [Cloud Run](https://jcas-narcos-api-396083626249.us-central1.run.app) |
| Auth & DB | Firebase Auth + Firestore | Google Cloud (project `jcas-narcos-d3c80`) |

[![Build and Deploy](https://github.com/morgang213/JCAS-NARCOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/morgang213/JCAS-NARCOS/actions)

---

## Features

- **PIN + Username authentication** — 4-digit PIN login with account lockout (5 failures / 15 min)
- **Role-based access** — Admin and standard user roles
- **Medication box CRUD** — Create, view, edit, and track boxes and their contents
- **Expiration scanning** — Dashboard alerts for expiring / expired medications
- **Audit logging** — Timestamped record of every action
- **Responsive UI** — Sidebar navigation, mobile-friendly layout

---

## Project Structure

```
JCAS-NARCOS/
├── client/               # React frontend (CRA)
│   ├── public/
│   └── src/
│       ├── api/          # Axios client & endpoint wrappers
│       ├── components/   # ProtectedRoute, Layout
│       ├── contexts/     # AuthContext (Firebase)
│       ├── firebase/     # Firebase client SDK config
│       └── pages/        # Login, Dashboard, Inventory, BoxDetail, BoxForm, AdminUsers, AuditLogs
├── server/               # Express API
│   ├── src/
│   │   ├── config/       # Firebase Admin SDK init
│   │   ├── middleware/   # auth, validation
│   │   ├── routes/       # auth, users, boxes, auditLogs
│   │   └── services/     # authService, boxService, auditService
│   ├── scripts/          # seed-admin.js
│   └── Dockerfile
├── firestore.rules
├── firestore.indexes.json
└── .github/workflows/    # CI/CD (GitHub Pages + Cloud Run)
```

---

## Prerequisites

- **Node.js** ≥ 18 (20 recommended)
- **npm** ≥ 9
- A **Firebase project** with Authentication (Email/Password) and Firestore enabled
- A **service account key** JSON file for the server

---

## Environment Variables

### Client (`client/.env`)

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=<your-api-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<project-id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<project>.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
REACT_APP_FIREBASE_APP_ID=<app-id>
```

### Server (`server/.env`)

```env
PORT=8080
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
ALLOWED_ORIGINS=http://localhost:3000
```

> **Note:** Never commit `.env` files or `serviceAccountKey.json`. Both are git-ignored.

---

## Getting Started

```bash
# 1. Install all dependencies (monorepo workspaces)
npm install

# 2. Create .env files (see templates above)

# 3. Seed the first admin user
npm run seed:admin

# 4. Start both client and server in dev mode
npm run dev
```

The client runs on `http://localhost:3000`, the API on `http://localhost:8080`.

---

## Deployment

### Frontend → GitHub Pages

Pushes to `main` that touch `client/**` trigger the [deploy workflow](.github/workflows/deploy.yml), which builds the React app and publishes to the `gh-pages` branch.

### Backend → Google Cloud Run

The server is containerized via `server/Dockerfile` and deployed to Cloud Run. The [backend workflow](.github/workflows/deploy-backend.yml) automates this (requires Workload Identity Federation). Manual deploy:

```bash
# Build & push image
gcloud builds submit server/ \
  --tag us-central1-docker.pkg.dev/jcas-narcos-d3c80/jcas-narcos/jcas-narcos-api

# Deploy to Cloud Run
gcloud run deploy jcas-narcos-api \
  --image us-central1-docker.pkg.dev/jcas-narcos-d3c80/jcas-narcos/jcas-narcos-api \
  --region us-central1 \
  --allow-unauthenticated
```

---

## License

Private — all rights reserved.

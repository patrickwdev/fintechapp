# Fintech App

**Personal finance and peer-to-peer payment app** built with **React Native** and **Expo**. Users can manage accounts, link banks, move money, and track activity in one mobile-first experience (with web support via Expo).

## What it does

- **Personal finance**: accounts overview, activity, cards, and profile flows tailored for everyday money management.
- **Payment**: pay bills, make payments, including recipient search and transfer flows.
- **Bank linking**: Plaid integration to connect financial institutions (native and web).
- **Backend & money movement**: Supabase for auth, data, and edge functions; Dwolla-related server and migration paths for wallet and funding flows.

## Tech stack

| Area | Choice |
|------|--------|
| App | React Native, **Expo** (SDK 54), **Expo Router** |
| Language | TypeScript |
| State / forms | React Context, React Hook Form, Redux Toolkit |
| Backend | **Supabase** (Postgres, Auth, Edge Functions) |
| Banking | **Plaid** (link + token exchange via local server in dev) |
| Payments | Dwolla (sandbox/server helpers and Supabase migrations) |
| Web deploy | Optional **Netlify** (`netlify.toml` + static export) |

## Prerequisites

- Node.js (LTS recommended)
- npm
- Expo Go app on a device (for physical device testing), or iOS Simulator / Android Emulator

## Getting started

1. Clone the repository and open the project root.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment templates and fill in your keys (see `.env.example` and `server/env.example`).

4. Start the Expo dev server:

   ```bash
   npm run dev
   ```

5. For **Plaid** during development, run the app and Plaid helper server together:

   ```bash
   npm run dev:with-plaid
   ```

## Web build

```bash
npm run build:web
```

## Linting

```bash
npm run lint
```

## Repository

Source: [github.com/patrickwdev/fintechapp](https://github.com/patrickwdev/fintechapp)

---

Configure Supabase, Plaid, and Dwolla credentials before using production-like flows; never commit real secrets (`.env` should stay local and ignored by Git).

# 🎲 DnD Mobile VTT

**Mobile-first Progressive Web App for Dungeons & Dragons virtual tabletop sessions.**

A feature-rich, offline-capable virtual tabletop designed for mobile devices. Run campaigns, manage characters, roll dice, explore interactive maps, and stay synced in real-time — even without an internet connection.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19 + Vite 8 + TypeScript + Tailwind CSS v4 |
| **Backend** | Node.js + Express 5 + Socket.IO |
| **Database** | MongoDB + IndexedDB (Dexie.js) |
| **PWA** | Service Worker with offline support |

---

## Project Structure

This project uses a **monorepo** layout:

```
dnd-vtt/
├── frontend/        # React PWA (Vite)
├── backend/         # Express API + Socket.IO server
├── shared/          # Shared TypeScript types & utilities
├── .env.example     # Environment variable template
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites

- **Node.js** >= 20.x
- **MongoDB** running locally or a remote connection string
- **npm** >= 10.x

### Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd dnd-vtt
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your MongoDB URI and a secure JWT secret.

3. **Install shared dependencies**

   ```bash
   cd shared && npm install
   ```

4. **Start the frontend**

   ```bash
   cd frontend && npm install && npm run dev
   ```

5. **Start the backend**

   ```bash
   cd backend && npm install && npm run dev
   ```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

---

## Features

- **Offline-First** — Full functionality without an internet connection via IndexedDB and service workers
- **RBAC Character Sheets** — Role-based access control separating DM and Player permissions
- **Real-Time Sync** — Live updates across all connected devices via Socket.IO
- **Dice Roller** — Cryptographically fair dice rolling with full roll history
- **Interactive Maps** — Pan, zoom, and annotate battle maps with token support
- **Family Trees** — Visual lineage tracking for characters and NPCs
- **Audio Mixer** — Ambient soundscapes and music layering for immersive sessions
- **Time Controller** — In-game calendar and time tracking for campaign continuity

---

## License

This project is licensed under the [MIT License](LICENSE).

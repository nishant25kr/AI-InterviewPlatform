# AI Interview Platform

A voice-based AI interview platform that conducts live technical interviews using Google Gemini's Live API. Candidates submit their GitHub profile, the system pulls public repo metadata to personalize questions, and a real-time voice conversation runs through a WebSocket bridge. After the interview, Gemini generates a hiring summary and score from the transcript.

## Features

- **GitHub-aware interviews** — Fetches public repository metadata and uses it to tailor technical questions
- **Real-time voice conversation** — Bidirectional audio streaming between the browser and Gemini Live
- **Live transcript** — Candidate and interviewer speech transcribed and displayed during the session
- **Automated wrap-up** — The AI interviewer ends the session gracefully and triggers post-interview scoring
- **Interview report** — Summary, score (0–10), and full transcript available on the results page

## Architecture

This is a [Turborepo](https://turbo.build/) monorepo with three apps:

```
┌─────────────┐     REST API      ┌─────────────┐
│   Frontend  │ ────────────────► │   Backend   │
│  (React)    │                   │  (Express)  │
└──────┬──────┘                   └──────┬──────┘
       │                                 │
       │ WebSocket                       │ Prisma
       ▼                                 ▼
┌─────────────┐     Gemini Live   ┌─────────────┐
│     WSS     │ ◄───────────────► │  PostgreSQL │
│  (Bun/ws)   │                   └─────────────┘
└─────────────┘
```

| App | Stack | Port (local) | Role |
|-----|-------|--------------|------|
| `apps/frontend` | React, Vite, Tailwind | 5173 | UI — intake form, live interview, results |
| `apps/backend` | Express, Prisma, Bun | 3000 | REST API — pre-interview setup, GitHub fetch, scoring |
| `apps/wss` | Bun, ws, Prisma | 8080 | WebSocket proxy to Gemini Live API |

In production, [Caddy](https://caddyserver.com/) reverse-proxies all three services behind a single domain (`/api/v1/*` → backend, `/ws` → wss, everything else → frontend).

## How it works

1. **Intake** — Candidate enters a GitHub URL on the home page
2. **Setup** — Backend fetches public repos via the GitHub API and creates an `Interview` record
3. **Live session** — Frontend opens a WebSocket to the WSS server, which connects to Gemini Live with a system prompt built from the candidate's GitHub metadata
4. **Audio** — Microphone audio (16 kHz PCM) streams to Gemini; AI responses (24 kHz PCM) play back in the browser
5. **Transcript** — Speech is transcribed on both sides and persisted to the database turn-by-turn
6. **Completion** — The AI calls an `end_interview` tool when done; the user is redirected to the results page
7. **Scoring** — Backend sends the transcript to Gemini for a written summary and numeric score

## Prerequisites

- [Bun](https://bun.sh/) 1.x (package manager and runtime)
- [PostgreSQL](https://www.postgresql.org/) 15+
- A [Google AI Studio](https://aistudio.google.com/) API key with access to Gemini Live models

## Environment variables

Create a `.env` file in the project root (or per-app as needed):

```env
# Database (shared by backend and wss)
DATABASE_URL=postgresql://postgres:password@localhost:5432/interview_db

# Backend — used for post-interview summary generation
API_KEY=your_google_ai_studio_api_key

# WSS — used for Gemini Live voice sessions
GEMINI_API_KEY=your_google_ai_studio_api_key

# Frontend (set in apps/frontend/.env for local dev)
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:8080

# Docker / production
DOMAIN=your-domain.com
```

## Local development

### 1. Install dependencies

```bash
bun install
```

### 2. Start PostgreSQL

Use Docker or a local Postgres instance. Example with Docker:

```bash
docker run -d \
  --name interview-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=interview_db \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Run database migrations

```bash
cd apps/backend
bunx prisma migrate dev
bunx prisma generate

cd ../wss
bunx prisma generate
```

### 4. Start all services

From the repo root:

```bash
bun run dev
```

Or start each app individually:

```bash
# Terminal 1 — Backend
cd apps/backend && bun run dev

# Terminal 2 — WebSocket server
cd apps/wss && bun run dev

# Terminal 3 — Frontend
cd apps/frontend && bun run dev
```

Open [http://localhost:5173](http://localhost:5173), enter a GitHub profile, and start an interview. Allow microphone access when prompted.

## Docker deployment

```bash
# Set required env vars in .env
DOMAIN=your-domain.com
API_KEY=your_google_ai_studio_api_key
GEMINI_API_KEY=your_google_ai_studio_api_key

docker compose up --build
```

Caddy handles TLS automatically when `DOMAIN` points to the host. The frontend is built with `VITE_API_URL=https://${DOMAIN}` and `VITE_WS_URL=wss://${DOMAIN}/ws`.

## Project structure

```
ai-interview-platform/
├── apps/
│   ├── backend/          # Express REST API
│   │   ├── prisma/       # Schema and migrations
│   │   └── src/
│   │       ├── routes/   # API routes
│   │       └── lib/      # Prisma client, Gemini helpers
│   ├── frontend/         # React SPA
│   │   └── src/
│   │       ├── Pages/    # Home, Interview, Result
│   │       ├── hooks/    # Mic capture and audio playback
│   │       └── Components/
│   └── wss/              # WebSocket server (Gemini Live bridge)
│       └── index.ts
├── docker-compose.yml
├── Caddyfile
├── turbo.json
└── package.json
```

## API reference

### `POST /api/v1/pre-interview`

Create a new interview session from a GitHub profile.

```json
// Request
{ "github": "github.com/username", "linkedin": "optional" }

// Response
{ "id": "uuid", "message": "Success" }
```

### `GET /api/v1/result/:interviewId`

Fetch the interview transcript, AI-generated summary, and score.

```json
// Response
{
  "message": "message found",
  "summary": "...",
  "score": 7,
  "transcript": [{ "id": "...", "message": "...", "type": "User", "interviewId": "..." }]
}
```

### WebSocket protocol (`ws://localhost:8080`)

| Client → Server | Description |
|-----------------|-------------|
| `{ type: "init", payload: { interviewId } }` | Start a session |
| `{ type: "audioMessage", payload: { realtimeInput: { audio: { data, mimeType } } } }` | Send mic audio chunk |

| Server → Client | Description |
|-----------------|-------------|
| `{ type: "status", status: "connected" }` | Gemini session ready |
| `{ type: "audio", payload: { data } }` | AI audio chunk (base64 PCM) |
| `{ type: "transcript", role, text }` | Transcript line |
| `{ type: "interviewComplete", payload: { candidateId } }` | Session finished |
| `{ type: "interrupted" }` | AI turn was interrupted |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all apps |
| `bun run lint` | Lint all apps |
| `bun run format` | Format with Prettier |

## License

Private — not licensed for public use.

# INBOX/AI

An AI-first email client (React, TypeScript, Redux). The inbox list shows one-line gists and a brief of what needs you now. Suggested replies sit in the composer — Apply fills the draft; nothing sends without you.

Mail, search, filters, and compose work **without** a model. Summaries, gists, briefs, and suggested replies need [Ollama](https://ollama.com) running locally with `llama3.1`.

## Prerequisites

- **Node.js 20+**
- **npm**
- **Ollama** (only for AI features) — [https://ollama.com/download](https://ollama.com/download)

## App setup

```bash
git clone <this-repo-url>
cd application
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You should land on `/inbox`.

Demo users (top-right **Current user** switcher — no login):

| User | Role | What you get |
|------|------|----------------|
| Alex Duarte | member | Inbox only |
| Priya Raman | admin | Inbox + **Activity** |

## Turn AI on (Ollama)

The header shows **AI unavailable** until Ollama is reachable. Mail still works.

### 1. Install Ollama

macOS:

```bash
brew install ollama
```

Or download from [ollama.com/download](https://ollama.com/download).

### 2. Start the server

```bash
ollama serve
```

Leave this running. Default API: `http://127.0.0.1:11434`.

If `ollama serve` says the port is already in use, Ollama is already running (common after the macOS app install). Continue to the next step.

### 3. Pull the model this app uses

```bash
ollama pull llama3.1
```

Confirm:

```bash
ollama list
```

You should see `llama3.1`. The model picker in the header must match this name.

### 4. Reload the app

Refresh [http://localhost:5173](http://localhost:5173) and click **Retry** on the insights banner, or switch user once.

The header should read **AI ready**. Then:

- Inbox gists and **What needs you now** fill in (or refresh from seed + live calls)
- Open a thread → **Retry** on summary, or **Regenerate** on suggested reply
- **New thread** → optional intent field → **Draft**

`npm run dev` proxies `/ollama` to Ollama so the browser does not hit CORS. You do **not** need `VITE_OLLAMA_URL` for local development.

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Vite dev server on port 5173 |
| `npm test` | Jest (P0 mail, filters, send, activity) |
| `npm run lint` | Oxlint |
| `npm run build` | Production typecheck + bundle |

## Project layout

```
src/
  components/     shell, inbox list, email view, compose
  store/          Redux slices (mail, session, filters, ai, activity)
  data/           mock mailbox (users, threads, messages)
  services/llm/   Ollama adapter + prompts
  config/models.ts
docs/PRD.md
docs/TEST_PLAN.md
```

## Troubleshooting

**Header still says AI unavailable**

1. `curl -s http://127.0.0.1:11434/api/tags` — if this fails, Ollama is not running.
2. `ollama list` — if `llama3.1` is missing, run `ollama pull llama3.1`.
3. Restart `npm run dev` after Ollama is up, then click **Retry**.

**Generate fails with AI ready**

The probe only checks that Ollama is up. Pull `llama3.1` (or change `src/config/models.ts` to a model you already have, e.g. `llama3.2` / `mistral`, and `ollama pull` that name).

**Using Ollama on another machine**

Copy `.env.example` to `.env` and set:

```
VITE_OLLAMA_URL=http://<host>:11434
```

That host must allow the Vite origin (`OLLAMA_ORIGINS=http://localhost:5173`). Restart the dev server after changing env vars.

## Product spec

See [docs/PRD.md](docs/PRD.md) and [docs/TEST_PLAN.md](docs/TEST_PLAN.md).

# Kilo AI Service

A production-style AI backend and web app starter inspired by Kilo's architecture patterns, but built as a separate SaaS service.

## Features

- AI chat UI in Next.js
- OpenAI and Anthropic provider support
- Session persistence in local JSON storage
- Ready for deployment on Vercel, Docker, or a Node host
- Environment-based configuration for API keys and defaults

## Quick start

1. Copy `.env.example` to `.env` and set your keys:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Environment variables

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DEFAULT_PROVIDER` (default: `openai`)
- `DEFAULT_MODEL` (default: `gpt-4o-mini`)

## Service architecture

- `app/page.tsx` - chat UI
- `app/api/chat/route.ts` - AI request endpoint
- `app/api/sessions/route.ts` - session CRUD
- `lib/ai.ts` - provider abstraction
- `lib/store.ts` - JSON storage for sessions

## Deployment

This project is already structured for a web service deployment. You can deploy to Vercel or run it behind a Node server.

For production, add:

- Postgres or a managed DB
- authentication and authorization
- per-user billing and quota limits
- file/project workspaces for code generation
- rate limits and audit logs

## Important

This repo is intentionally a service-friendly starter, not a direct fork of the Kilo agent codebase. It uses the same product ideas and provider patterns without depending on the upstream repo internals.

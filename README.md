# Kilo AI Service

A private, account-based AI chat web application with OpenAI and Anthropic providers. This is a separate application inspired by Kilo's provider architecture; it is not the Kilo Code desktop/IDE agent.

## Requirements

- Node.js 20+
- PostgreSQL 14+
- An OpenAI or Anthropic API key

## Local setup

```bash
cp .env.example .env.local
# Set DATABASE_URL, AUTH_SECRET (32+ random characters), and at least one provider API key.
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000. The first user can register through the UI. API keys stay server-side and must only be configured as deployment secrets/environment variables.

## Environment

- `DATABASE_URL` — PostgreSQL connection URL. Use a managed database connection string in production.
- `AUTH_SECRET` — secret of at least 32 characters for signed, HttpOnly sessions.
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — optional provider secrets; configure at least one.
- `DATABASE_SSL=disable` — only for local PostgreSQL. SSL is required by default.
- `DEFAULT_PROVIDER`, `DEFAULT_MODEL`, `NEXT_PUBLIC_APP_NAME` — optional app defaults/label.

## Production deployment checklist

1. Configure PostgreSQL backups, connection limits, and apply `db/migrations/001_initial.sql`.
2. Add secrets through the hosting provider's secret manager; never commit `.env.local`.
3. Set HTTPS and `NODE_ENV=production`; cookies become Secure in production.
4. Configure platform-level rate limiting/WAF on `/api/auth/*` and `/api/chat` before public launch. Application-level process memory limits are not distributed and are not a substitute.
5. Set monitoring/alerts, database backups, provider spend limits, and privacy/retention policy.
6. Run `npm run typecheck` and `npm run build` in CI before deployment.

## API

- `POST /api/auth/register` and `POST /api/auth/login` — create/sign in account.
- `GET /api/auth/me` and `DELETE /api/auth/me` — inspect/sign out.
- `GET|POST|PATCH|DELETE /api/sessions` — authenticated, owner-scoped sessions.
- `POST /api/chat` — authenticated AI request, persisted conversation, allowlisted provider/models.
- `GET /api/health` — database readiness check.

## Limitations

This MVP provides password-based authentication and persisted private chat history. Before accepting public traffic, add an email verification/password reset flow, durable distributed rate limiting, abuse detection, billing/quotas, structured audit/retention controls, and a production security review. No build or live provider request was executed while generating these repository changes; run the commands above in your deployment environment.

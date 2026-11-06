Update `.env.example` with the following additional variable:

```dotenv
ADMIN_EMAILS=admin@example.com
```

Apply the new migration after the existing one:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/002_projects_usage_rate_limits.sql
```

The admin page is available at `/admin` only to an authenticated email listed in `ADMIN_EMAILS`. AI usage records include token counts and latency; dollar costs are intentionally not guessed because model pricing changes. The in-memory middleware limiter has been removed: multi-instance production rate limiting must use a shared store. The `api_rate_limits` table is provided for authenticated endpoints; configure platform edge throttling for unauthenticated auth routes and apply a cleanup job to expired rate-limit rows.

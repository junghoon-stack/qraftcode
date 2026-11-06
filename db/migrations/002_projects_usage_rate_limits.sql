create table if not exists projects (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  description text not null default '' check (length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_updated_idx on projects(user_id, updated_at desc);

create table if not exists ai_usage (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  session_id uuid references chat_sessions(id) on delete set null,
  provider text not null check (provider in ('openai', 'anthropic')),
  model text not null,
  input_tokens integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0),
  duration_ms integer not null check (duration_ms >= 0),
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_created_idx on ai_usage(user_id, created_at desc);
create index if not exists ai_usage_created_idx on ai_usage(created_at desc);

create table if not exists api_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0)
);

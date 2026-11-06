create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists chat_sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  provider text not null check (provider in ('openai', 'anthropic')),
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_updated_idx on chat_sessions(user_id, updated_at desc);

create table if not exists chat_messages (
  id uuid primary key,
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) <= 12000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_created_idx on chat_messages(session_id, created_at);

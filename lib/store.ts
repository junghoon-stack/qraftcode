import { randomUUID } from "crypto";
import { database } from "@/lib/db";
import type { Message, ProviderName, Session } from "@/lib/types";

export async function listSessions(userId: string): Promise<Session[]> {
  const rows = await database()<any[]>`select id, title, provider, model, created_at, updated_at from chat_sessions where user_id = ${userId} order by updated_at desc limit 100`;
  return Promise.all(rows.map((row) => getSessionById(userId, row.id)).filter(Boolean) as Promise<Session>[]);
}

export async function getSessionById(userId: string, id: string): Promise<Session | null> {
  const db = database();
  const [row] = await db<any[]>`select id, title, provider, model, created_at, updated_at from chat_sessions where id = ${id} and user_id = ${userId} limit 1`;
  if (!row) return null;
  const messages = await db<any[]>`select id, role, content, created_at from chat_messages where session_id = ${id} order by created_at asc`;
  return {
    id: row.id,
    title: row.title,
    provider: row.provider,
    model: row.model,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    messages: messages.map((message) => ({ id: message.id, role: message.role, content: message.content, createdAt: new Date(message.created_at).toISOString() })),
  };
}

export async function createSession(userId: string, input: { title: string; provider: ProviderName; model: string }) {
  const id = randomUUID();
  await database()`insert into chat_sessions (id, user_id, title, provider, model) values (${id}, ${userId}, ${input.title}, ${input.provider}, ${input.model})`;
  return getSessionById(userId, id);
}

export async function appendMessage(userId: string, sessionId: string, message: Pick<Message, "role" | "content">) {
  const id = randomUUID();
  const db = database();
  const rows = await db.begin(async (tx) => {
    const [session] = await tx<any[]>`select id from chat_sessions where id = ${sessionId} and user_id = ${userId} for update`;
    if (!session) return false;
    await tx`insert into chat_messages (id, session_id, role, content) values (${id}, ${sessionId}, ${message.role}, ${message.content})`;
    await tx`update chat_sessions set updated_at = now() where id = ${sessionId}`;
    return true;
  });
  return rows ? getSessionById(userId, sessionId) : null;
}

export async function deleteSession(userId: string, id: string) {
  const result = await database()`delete from chat_sessions where id = ${id} and user_id = ${userId} returning id`;
  return result.length > 0;
}

export async function renameSession(userId: string, id: string, title: string) {
  const result = await database()`update chat_sessions set title = ${title}, updated_at = now() where id = ${id} and user_id = ${userId} returning id`;
  return result.length ? getSessionById(userId, id) : null;
}

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import type { Message, ProviderName, Session } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "sessions.json");

const emptyStore = { sessions: [] as Session[] };

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(STORE_PATH, "utf-8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(emptyStore, null, 2), "utf-8");
  }
}

async function readStore(): Promise<{ sessions: Session[] }> {
  await ensureStore();
  const content = await readFile(STORE_PATH, "utf-8");
  try {
    return JSON.parse(content) as { sessions: Session[] };
  } catch {
    return emptyStore;
  }
}

async function writeStore(store: { sessions: Session[] }) {
  await ensureStore();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function listSessions(): Promise<Session[]> {
  const store = await readStore();
  return [...store.sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSessionById(id: string): Promise<Session | null> {
  const store = await readStore();
  return store.sessions.find((session) => session.id === id) ?? null;
}

export async function createSession(input: { title?: string; provider?: ProviderName; model?: string } = {}): Promise<Session> {
  const now = new Date().toISOString();
  const session: Session = {
    id: randomUUID(),
    title: input.title ?? "New conversation",
    provider: input.provider ?? "openai",
    model: input.model ?? process.env.DEFAULT_MODEL ?? "gpt-4o-mini",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  const store = await readStore();
  store.sessions.push(session);
  await writeStore(store);
  return session;
}

export async function appendMessage(sessionId: string, message: Message): Promise<Session | null> {
  const store = await readStore();
  const index = store.sessions.findIndex((session) => session.id === sessionId);
  if (index === -1) return null;

  const session = store.sessions[index];
  session.messages.push(message);
  session.updatedAt = new Date().toISOString();
  store.sessions[index] = session;
  await writeStore(store);
  return session;
}

export async function replaceSession(sessionId: string, session: Session): Promise<Session | null> {
  const store = await readStore();
  const index = store.sessions.findIndex((item) => item.id === sessionId);
  if (index === -1) return null;

  store.sessions[index] = session;
  await writeStore(store);
  return session;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const store = await readStore();
  const nextSessions = store.sessions.filter((session) => session.id !== sessionId);
  if (nextSessions.length === store.sessions.length) return false;

  store.sessions = nextSessions;
  await writeStore(store);
  return true;
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<Session | null> {
  const store = await readStore();
  const session = store.sessions.find((item) => item.id === sessionId);
  if (!session) return null;

  session.title = title;
  session.updatedAt = new Date().toISOString();
  await writeStore(store);
  return session;
}

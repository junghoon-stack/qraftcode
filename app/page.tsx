"use client";

import { useEffect, useMemo, useState } from "react";

import type { Message, Session } from "@/lib/types";

const defaultModelByProvider = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
} as const;

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState(defaultModelByProvider.openai);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  async function loadSessions() {
    const response = await fetch("/api/sessions");
    const data = (await response.json()) as { sessions?: Session[] };
    const nextSessions = data.sessions ?? [];
    setSessions(nextSessions);

    if (!activeSessionId && nextSessions.length > 0) {
      setActiveSessionId(nextSessions[0].id);
    }
  }

  async function loadSession(id: string) {
    const response = await fetch(`/api/sessions?id=${id}`);
    const data = (await response.json()) as { session?: Session };
    if (data.session) {
      setMessages(data.session.messages);
      setActiveSessionId(data.session.id);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const currentSession = sessions.find((session) => session.id === activeSessionId);
    if (currentSession) {
      setMessages(currentSession.messages);
    }
  }, [activeSessionId, sessions]);

  const createSession = async () => {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model }),
    });

    const data = (await response.json()) as { session?: Session; error?: string };
    if (!data.session) {
      throw new Error(data.error ?? "Failed to create session");
    }

    setActiveSessionId(data.session.id);
    setMessages(data.session.messages);
    await loadSessions();
    return data.session.id;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsSending(true);
    setError(null);

    try {
      const sessionId = activeSessionId ?? (await createSession());
      const nextMessages = [...messages, { id: crypto.randomUUID(), role: "user", content: input.trim(), createdAt: new Date().toISOString() }];
      setMessages(nextMessages);
      setInput("");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          provider,
          model,
          messages: nextMessages,
        }),
      });

      const data = (await response.json()) as { error?: string; message?: Message; sessionId?: string };
      if (!response.ok || !data.message) {
        throw new Error(data.error ?? "AI request failed");
      }

      await loadSessions();
      if (sessionId) {
        await loadSession(sessionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleNewSession = async () => {
    await createSession();
  };

  const handleProviderChange = (value: "openai" | "anthropic") => {
    setProvider(value);
    setModel(defaultModelByProvider[value]);
  };

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <p className="eyebrow">AI Workspace</p>
            <h1>Kilo AI Service</h1>
          </div>
          <button className="primary-button" onClick={handleNewSession}>New chat</button>
        </div>

        <div className="provider-row">
          <label>
            Provider
            <select value={provider} onChange={(event) => handleProviderChange(event.target.value as "openai" | "anthropic")}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </label>

          <label>
            Model
            <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="gpt-4o-mini" />
          </label>
        </div>

        <div className="session-list">
          {sessions.length === 0 && <p className="empty-state">No sessions yet.</p>}
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`session-item ${activeSessionId === session.id ? "active" : ""}`}
              onClick={() => loadSession(session.id)}
            >
              <strong>{session.title}</strong>
              <span>{new Date(session.updatedAt).toLocaleString()}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-panel">
        <div className="chat-header">
          <div>
            <p className="eyebrow">Live session</p>
            <h2>{activeSession ? activeSession.title : "No active session"}</h2>
          </div>
          <div className="badge">{provider} / {model}</div>
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div className="intro-card">
              <h3>Start a production-ready AI workflow</h3>
              <p>Use this chat to prompt the LLM, manage sessions, and plug in your own provider secrets.</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-role">{message.role === "user" ? "You" : "Assistant"}</div>
              <p>{message.content}</p>
            </div>
          ))}
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="composer">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={5}
            placeholder="Ask the AI to build, explain, or debug something..."
          />
          <button className="primary-button large" onClick={handleSend} disabled={isSending}>
            {isSending ? "Processing..." : "Send"}
          </button>
        </div>
      </section>
    </main>
  );
}

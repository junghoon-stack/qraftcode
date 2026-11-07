"use client";

import { FormEvent, useEffect, useState } from "react";

type Message = { id: string; role: "user" | "assistant"; content: string; createdAt: string };
type Session = { id: string; title: string; provider: "openai" | "anthropic"; model: string; updatedAt: string; messages: Message[] };
type User = { id: string; email: string };
type Provider = { id: "openai" | "anthropic"; label: string; models: string[] };

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const [providers, setProviders] = useState<Provider[]>([{ id: "openai", label: "AI", models: [] }]);
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadSessions() {
    const response = await fetch("/api/sessions");
    if (!response.ok) return;
    const data = await response.json() as { sessions: Session[] };
    setSessions(data.sessions);
    if (active) setActive(data.sessions.find((item) => item.id === active.id) ?? null);
  }

  useEffect(() => {
    void fetch("/api/models").then((r) => r.json()).then((data: { providers?: Provider[] }) => {
      const list = data.providers ?? [];
      if (list.length === 0) return;
      setProviders(list);
      setProvider(list[0].id);
      setModel(list[0].models[0] ?? "");
    }).catch(() => {});
    void fetch("/api/auth/me").then((r) => r.json()).then((data) => { setUser(data.user); if (data.user) void loadSessions(); }).catch(() => {});
  }, []);

  function openSession(session: Session) {
    setActive(session);
    setProvider(session.provider);
    setModel(session.model);
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch(`/api/auth/${authMode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Authentication failed.");
      setUser(data.user); await loadSessions();
    } catch (e) { setError(e instanceof Error ? e.message : "Authentication failed."); }
    finally { setBusy(false); }
  }

  async function signOut() { await fetch("/api/auth/me", { method: "DELETE" }); setUser(null); setActive(null); setSessions([]); }

  async function newChat() {
    const response = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, model }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to start a chat.");
    setActive(data.session); await loadSessions();
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || busy) return;
    const content = prompt.trim(); setPrompt(""); setBusy(true); setError("");
    const optimistic: Message = { id: crypto.randomUUID(), role: "user", content, createdAt: new Date().toISOString() };
    if (active) setActive({ ...active, messages: [...active.messages, optimistic] });
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: active?.id, provider, model, content }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "AI request failed.");
      setActive(data.session); await loadSessions();
    } catch (e) { setError(e instanceof Error ? e.message : "AI request failed."); }
    finally { setBusy(false); }
  }

  if (!user) return <main className="auth-shell"><form className="auth-card" onSubmit={submitAuth}>
    <div className="brand-mark">K</div><p className="eyebrow">PRIVATE AI WORKSPACE</p><h1>{authMode === "register" ? "Create your account" : "Welcome back"}</h1>
    <p className="muted">Your conversations are private to your account.</p>
    <label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label>Password<input type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} minLength={authMode === "register" ? 12 : 1} required value={password} onChange={(e) => setPassword(e.target.value)} />{authMode === "register" && <small>Use at least 12 characters.</small>}</label>
    {error && <div className="error-box">{error}</div>}<button className="primary-button full" disabled={busy}>{busy ? "Please wait…" : authMode === "register" ? "Create account" : "Sign in"}</button>
    <button className="text-button" type="button" onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setError(""); }}>{authMode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
  </form></main>;

  return <main className="app-shell"><aside className="sidebar"><div className="brand-row"><div className="brand-mark small">K</div><div><strong>Kilo Workspace</strong><small>{user.email}</small></div></div>
    <button className="primary-button full" onClick={() => void newChat()}>＋ New chat</button><div className="sidebar-label">RECENT CHATS</div>
    <nav className="session-list">{sessions.map((session) => <button key={session.id} className={`session-item ${active?.id === session.id ? "active" : ""}`} onClick={() => openSession(session)}><strong>{session.title}</strong><small>{new Date(session.updatedAt).toLocaleDateString()}</small></button>)}{sessions.length === 0 && <p className="muted">Your chats will appear here.</p>}</nav>
    <button className="text-button logout" onClick={() => void signOut()}>Sign out</button>
  </aside><section className="workspace"><header className="topbar"><div><p className="eyebrow">AI WORKSPACE</p><h2>{active?.title ?? "What can I help you build?"}</h2></div><div className="controls">{providers.length > 1 && <select aria-label="AI provider" value={provider} onChange={(e) => { const id = e.target.value as "openai" | "anthropic"; const next = providers.find((item) => item.id === id); setProvider(id); setModel(next?.models[0] ?? ""); }}>{providers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>}<select aria-label="Model" value={model} onChange={(e) => setModel(e.target.value)}>{(providers.find((item) => item.id === provider)?.models ?? []).map((item) => <option key={item}>{item}</option>)}</select></div></header>
    <section className="conversation">{!active?.messages.length ? <div className="welcome"><div className="welcome-icon">✳</div><h1>Build something great.</h1><p>Describe a coding task, ask a question, or get help debugging.</p><div className="suggestions"><button onClick={() => setPrompt("Help me plan a secure web application")}>Plan a web application <span>↗</span></button><button onClick={() => setPrompt("Review this code for bugs and security issues")}>Review code for issues <span>↗</span></button><button onClick={() => setPrompt("Explain how to structure a TypeScript project")}>Explain a concept <span>↗</span></button></div></div> : active.messages.map((message) => <article key={message.id} className={`message ${message.role}`}><div className="avatar">{message.role === "user" ? "You" : "K"}</div><div><div className="message-name">{message.role === "user" ? "You" : "Kilo AI"}</div><p>{message.content}</p></div></article>)}</section>
    {error && <div className="error-box inline-error">{error}</div>}<form className="composer" onSubmit={sendMessage}><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={12000} rows={3} placeholder="Message Kilo AI…" disabled={busy} /><div className="composer-footer"><span>AI can make mistakes. Review important changes.</span><button className="send-button" disabled={busy || !prompt.trim()}>{busy ? "…" : "↑"}</button></div></form>
  </section></main>;
}

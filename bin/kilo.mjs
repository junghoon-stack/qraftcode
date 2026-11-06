#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { homedir } from "node:os";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_DIR = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "kilo-ai-service");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const DEFAULT_API = "http://localhost:3000";

function help() {
  console.log(`Kilo AI Service CLI\n\nUsage:\n  npm run cli -- login [--api URL]\n  npm run cli -- whoami\n  npm run cli -- sessions\n  npm run cli -- ask <prompt> [--provider openai|anthropic] [--model MODEL]\n  npm run cli -- chat [--provider openai|anthropic] [--model MODEL]\n  npm run cli -- logout\n\nConfigure the web app URL with --api during login. Credentials are stored in\n${CONFIG_PATH} with owner-only permissions. This CLI sends prompts to your configured service.`);
}

async function loadConfig() {
  try {
    return JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  } catch {
    return { apiUrl: DEFAULT_API, cookie: "" };
  }
}

async function saveConfig(config) {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  await chmod(CONFIG_DIR, 0o700);
  await chmod(CONFIG_PATH, 0o600);
}

function parseArgs(args) {
  const options = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--api" || args[i] === "--provider" || args[i] === "--model") {
      options[args[i].slice(2)] = args[++i];
    } else positional.push(args[i]);
  }
  return { options, positional };
}

function normalizeApiUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("API URL must use HTTP or HTTPS.");
  return url.toString().replace(/\/$/, "");
}

async function request(config, path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (init.body) headers.set("content-type", "application/json");
  if (config.cookie) headers.set("cookie", config.cookie);
  let response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, { ...init, headers });
  } catch {
    throw new Error(`Could not connect to ${config.apiUrl}. Is the service running?`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return { data, response };
}

async function readHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    const rl = createInterface({ input: stdin, output: stdout });
    try { return await rl.question(`${prompt} (input may be visible): `); }
    finally { rl.close(); }
  }
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
      if (error) reject(error); else resolve(value);
    };
    const onData = (key) => {
      if (key === "\u0003") return finish(new Error("Cancelled."));
      if (key === "\r" || key === "\n") return finish();
      if (key === "\u007f" || key === "\b") { value = value.slice(0, -1); return; }
      if (key >= " ") value += key;
    };
    stdin.on("data", onData);
  });
}

async function login(options) {
  const config = await loadConfig();
  config.apiUrl = normalizeApiUrl(options.api || config.apiUrl || DEFAULT_API);
  const rl = createInterface({ input: stdin, output: stdout });
  let email;
  try { email = (await rl.question("Email: ")).trim(); }
  finally { rl.close(); }
  const password = await readHidden("Password: ");
  const response = await fetch(`${config.apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Sign in failed (${response.status}).`);
  const setCookie = response.headers.get("set-cookie") || "";
  const cookie = setCookie.match(/(?:^|,\s*)(kilo_session=[^;,]+)/)?.[1];
  if (!cookie) throw new Error("Sign-in succeeded but the service did not return a session cookie.");
  config.cookie = cookie;
  await saveConfig(config);
  console.log(`Signed in to ${config.apiUrl}. Credential stored in ${CONFIG_PATH}.`);
}

async function requireLogin() {
  const config = await loadConfig();
  if (!config.cookie) throw new Error("Not signed in. Run: npm run cli -- login --api https://your-service.example");
  return config;
}

async function whoami() {
  const config = await requireLogin();
  const { data } = await request(config, "/api/auth/me");
  if (!data.user) throw new Error("Saved sign-in is expired. Run login again.");
  console.log(`${data.user.email} (${config.apiUrl})`);
}

async function listSessions() {
  const config = await requireLogin();
  const { data } = await request(config, "/api/sessions");
  if (!data.sessions?.length) return console.log("No conversations yet.");
  for (const session of data.sessions) console.log(`${session.id}\t${session.title}\t${session.updatedAt}`);
}

function displayConversation(session, answer) {
  if (session?.id) console.log(`\nSession: ${session.id} — ${session.title}`);
  console.log(`\nKilo AI\n${answer}\n`);
}

async function sendPrompt(config, prompt, options, sessionId) {
  if (!prompt.trim()) throw new Error("Prompt cannot be empty.");
  const provider = options.provider || "openai";
  if (!['openai', 'anthropic'].includes(provider)) throw new Error("Provider must be openai or anthropic.");
  const model = options.model || (provider === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet-20241022");
  const { data } = await request(config, "/api/chat", {
    method: "POST",
    body: JSON.stringify({ ...(sessionId ? { sessionId } : {}), provider, model, content: prompt }),
  });
  displayConversation(data.session, data.assistant);
  return data.session;
}

async function ask(args) {
  const config = await requireLogin();
  const { options, positional } = parseArgs(args);
  const sessionIdIndex = positional.indexOf("--session");
  let sessionId;
  if (sessionIdIndex >= 0) {
    sessionId = positional[sessionIdIndex + 1];
    positional.splice(sessionIdIndex, 2);
  }
  await sendPrompt(config, positional.join(" "), options, sessionId);
}

async function chat(args) {
  const config = await requireLogin();
  const { options } = parseArgs(args);
  let sessionId;
  console.log("Kilo AI chat. Type /exit to quit; /new starts a fresh conversation.");
  const rl = createInterface({ input: stdin, output: stdout, prompt: "you> " });
  rl.prompt();
  for await (const line of rl) {
    const text = line.trim();
    if (text === "/exit" || text === "/quit") break;
    if (text === "/new") { sessionId = undefined; console.log("Started a new conversation."); rl.prompt(); continue; }
    if (text) {
      try {
        const session = await sendPrompt(config, text, options, sessionId);
        sessionId = session?.id || sessionId;
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : "Request failed."}`);
      }
    }
    rl.prompt();
  }
  rl.close();
}

async function logout() {
  const config = await loadConfig();
  if (config.cookie) {
    try { await request(config, "/api/auth/me", { method: "DELETE" }); } catch { /* clear local credentials even if the server is offline */ }
  }
  await saveConfig({ apiUrl: config.apiUrl || DEFAULT_API, cookie: "" });
  console.log("Removed the saved CLI credential. Sign in again to use the CLI.");
}

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  if (command === "--help" || command === "-h" || command === "help") return help();
  if (command === "login") { const { options } = parseArgs(args); return login(options); }
  if (command === "logout") return logout();
  if (command === "whoami") return whoami();
  if (command === "sessions") return listSessions();
  if (command === "ask") return ask(args);
  if (command === "chat") return chat(args);
  throw new Error(`Unknown command: ${command}. Run 'npm run cli -- --help'.`);
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : "Unexpected error."}`);
  process.exitCode = 1;
});

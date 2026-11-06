# Kilo AI Service CLI

The CLI is a lightweight terminal client for the authenticated SaaS API. It does not execute shell commands or modify local files. Prompts are sent to the configured web service, which calls the server-configured AI provider.

## Run from this repository

```bash
npm install
npm run cli -- --help
npm run cli -- login --api http://localhost:3000
npm run cli -- whoami
npm run cli -- sessions
npm run cli -- ask "Explain this TypeScript error" --provider openai --model gpt-4o-mini
npm run cli -- chat --provider anthropic
npm run cli -- logout
```

First start the web app and create an account in its browser UI, then sign in through the CLI using the same account. For hosted use, replace the API URL with your HTTPS deployment URL.

The CLI stores the service session cookie in `${XDG_CONFIG_HOME:-~/.config}/kilo-ai-service/config.json`, with directory/file permissions set to `0700`/`0600`. Treat this file as a credential. `logout` clears the local copy and asks the service to clear its cookie; the current server uses stateless signed cookies, so logout does not revoke a previously copied cookie before its expiry.

## Commands

- `login --api URL`: authenticate to the web service and save a local credential.
- `whoami`: verify the saved credential.
- `sessions`: list the signed-in user's conversations.
- `ask PROMPT [--session UUID] [--provider ...] [--model ...]`: send one prompt, optionally continuing a session.
- `chat [--provider ...] [--model ...]`: interactive conversation; `/new` starts a new session and `/exit` quits.
- `logout`: remove the saved CLI credential.

`ask` and `chat` use the service's enabled provider/model allowlist and server-held provider API keys. The CLI itself never receives the OpenAI or Anthropic key.

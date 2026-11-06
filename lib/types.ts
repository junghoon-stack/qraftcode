export const runtime = "nodejs";

export type ProviderName = "openai" | "anthropic";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Session = {
  id: string;
  title: string;
  provider: ProviderName;
  model: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

# Getting Started with Vercel AI SDK (TypeScript)

*Added: 2026-05-06*

---

## Overview

This guide shows how to wire Oracle into a TypeScript agent using the [Vercel AI SDK](https://sdk.vercel.ai/) and [Composio](https://composio.dev/). The agent uses Anthropic's Claude to execute tool calls routed through Composio's tool-router session.

---

## Step 1: Install Dependencies

```bash
npm install @composio/core @composio/vercel ai @ai-sdk/anthropic
```

---

## Step 2: Set Environment Variables

```
COMPOSIO_API_KEY=<your-api-key>
```

---

## Step 3: Create Your Agent

See `agent.ts` at the project root for the full implementation.

```typescript
// agent.ts — Vercel AI SDK + Composio

import { anthropic } from "@ai-sdk/anthropic";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { stepCountIs, streamText } from "ai";

const composio = new Composio({ provider: new VercelProvider() });
const userId = "user_knpebb"; // Replace with your own user identifier

// Create a tool router session
const session = await composio.create(userId);
const tools = await session.tools();

const stream = await streamText({
  model: anthropic("claude-sonnet-4-6"),
  prompt: "Star the composiohq/composio repo on GitHub",
  stopWhen: stepCountIs(10),
  tools,
});

for await (const textPart of stream.textStream) {
  process.stdout.write(textPart);
}
```

---

## Documentation

- [Composio Documentation](https://docs.composio.dev)
- [Tool Router Guide](https://docs.composio.dev/tool-router/overview)
- [Managing Multiple Accounts](https://docs.composio.dev/tool-router/managing-multiple-accounts)

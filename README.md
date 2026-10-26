# XYZ Company HR Leave Assistant

A complete, stateful AI Chat Assistant built for the XYZ Company HR assessment using the **Cloudflare Agents SDK** (`agents`, `@cloudflare/ai-chat`) and **Cloudflare Workers AI**.

## 🌟 Key Features

1. **Stateful Agent Architecture**: Built on Cloudflare Durable Objects with automatic SQLite message persistence, reconnect recovery, and real-time WebSocket communication.
2. **100% Self-Contained Workers AI**: Zero third-party API keys (no OpenAI or Anthropic). Inference is executed entirely via Cloudflare's native Workers AI binding (`@cf/meta/llama-3.1-8b-instruct`).
3. **Context Stuffing (No Vector DB / RAG)**: The full XYZ Company Leave Policy (`HR-POL-004 v2.0`) is hardcoded as `LEAVE_POLICY_TEXT` and injected directly into the system prompt for deterministic, grounded reasoning.
4. **Strict Rules & Constraints**:
   - **Rule 1: Strict Accuracy & Mandatory Citation**: Responses must cite exact section numbers in brackets (e.g., `[Section 4.1]`).
   - **Rule 2: Out of Scope Fallback**: Any question not answerable from the policy strictly outputs: _"I don't know, please contact HR."_
   - **Rule 3: Data Privacy Protection**: Questions inquiring about other employees' leave records strictly output: _"Leave records are confidential. I cannot share information about other employees. Please contact the HR Department."_
5. **Polished Corporate UI**:
   - Fixed Deep Blue corporate header (`bg-blue-900`) with XYZ Company logo (`xyz.png`).
   - Scrollable message history with distinct soft gray (user) and soft teal (assistant) chat bubbles.
   - Live visual loading indicator while consulting the policy.
   - Sticky bottom input bar with send and stop streaming controls.
   - Interactive policy summary modal and quick question prompts.

---

## 🛠️ Project Structure

```
├── public/
│   ├── xyz.png             # Official XYZ Company logo
│   └── favicon.ico
├── src/
│   ├── server.ts           # Cloudflare ChatAgent class, system prompt, and Workers AI integration
│   ├── policy.ts           # LEAVE_POLICY_TEXT constant containing the full XYZ Leave Policy
│   ├── app.tsx             # Polished single-page React chat application
│   ├── client.tsx          # React 19 client entry point
│   └── styles.css          # Tailwind CSS v4 styling & corporate palette
├── scripts/
│   └── verify.mjs          # Automated compliance verification test
├── instructions.txt        # Source system instructions and constraints
├── policy.txt              # Source XYZ Company Leave Policy document
├── wrangler.jsonc          # Cloudflare configuration with Workers AI and Durable Objects
├── wrangler.toml           # Companion Wrangler configuration
├── vite.config.ts          # Vite configuration with Cloudflare Vite plugin
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v20+ or v24+ LTS installed.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Locally (Development)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note on Cloudflare Workers AI**: Workers AI model inference runs remotely on Cloudflare's network. When developing locally, ensure you are logged into Wrangler via `npx wrangler login` or have `CLOUDFLARE_API_TOKEN` set.

### 4. Code Quality & Verification

```bash
# Run formatting check, linter, and TypeScript compiler check
npm run check

# Run automated policy & constraint verification test
node scripts/verify.mjs
```

### 5. Build for Production / Deployment

```bash
npm run deploy -- --dry-run
```

To deploy to your Cloudflare account:

```bash
npm run deploy
```

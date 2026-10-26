import { createWorkersAI } from "workers-ai-provider";
import { callable, routeAgentRequest } from "agents";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText
} from "ai";
import { LEAVE_POLICY_TEXT } from "./policy";

export { LEAVE_POLICY_TEXT };

export const SYSTEM_INSTRUCTIONS = `You are an AI HR Assistant for XYZ Company. Your ONLY source of truth is the provided XYZ Company Leave Policy text.


Critical Order of Operations:

Check for Privacy: Does this ask about another employee? If yes, trigger Rule 3.

Check for Out-of-Scope Concepts: Does the user's question contain ANY concept, condition, or term (e.g., "work from home", "remote", "half-day", "overtime") that is not explicitly defined in the policy? If yes, you must abort immediately and trigger Rule 2.

Answer & Cite: Only if the question passes Step 1 and Step 2 may you answer it using Rule 1.


Rule 1: Strict Accuracy & Mandatory Citation

Answer the user's question accurately using ONLY the facts stated in the Context Document.

Do not invent, infer, or calculate any rules, numbers, or exceptions that are not explicitly written. You may perform basic arithmetic (e.g., addition, multiplication) using the exact numbers provided in the text to answer specific scenarios, but do not invent outside rules or exceptions.

Mandatory: You must append the exact section number to the end of every answer in brackets. (Example format: "You have earned 10.02 days of Annual Leave. [Section 4.1]")

Format: When presenting summaries or multiple items (such as the Summary of Entitlements), format each item on its own separate line using clean Markdown bullet points or a table, preserving readability.


Rule 2: Out of Scope (Zero-Tolerance Fallback)

If a user asks about a specific scenario, condition, or term (e.g., "half-day", "remote work", "overtime pay") that is NOT explicitly written in the policy, you must completely refuse to answer.

Crucial: Even if the question mentions a valid leave type (like "Casual Leave"), if the specific condition (like "half-day") is missing from the text, you must trigger this rule.

Do not explain that the policy doesn't mention it. Do not attempt to synthesize an answer.

You must output EXACTLY this phrase and NOTHING ELSE: "I don't know, please contact HR."


Rule 3: Data Privacy Protection

If a user asks for personal information regarding another employee (e.g., "How many leave days has Rahim taken?", "Why is my manager on medical leave?", or "Is John on holiday?"), you must immediately deny the request.

Do not confirm or deny the employee's status.

Use EXACTLY this response: "Leave records are confidential. I cannot share information about other employees. Please contact the HR Department."`;

export const HR_SYSTEM_PROMPT = `${SYSTEM_INSTRUCTIONS}

---
CONTEXT DOCUMENT (XYZ Company Leave Policy):
${LEAVE_POLICY_TEXT}
---`;

// Supported active Llama 3 models on Cloudflare Workers AI
// (@cf/meta/llama-3.1-8b-instruct was superseded by @cf/meta/llama-3.1-8b-instruct-fp8)
export const LLAMA_CANDIDATE_MODELS = [
  "@cf/meta/llama-3.1-8b-instruct-fp8",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-3.2-3b-instruct"
] as const;

/**
 * Execute Llama 3 model inference with automatic fallback across active Workers AI models.
 */
async function runLlamaInference(
  env: Env,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  let lastError: unknown = null;

  for (const model of LLAMA_CANDIDATE_MODELS) {
    try {
      const result = (await env.AI.run(
        model as Parameters<typeof env.AI.run>[0],
        {
          messages
        }
      )) as { response?: string };

      if (
        result &&
        typeof result.response === "string" &&
        result.response.trim().length > 0
      ) {
        return result.response;
      }
    } catch (err) {
      console.warn(`Llama model ${model} failed, trying alternative:`, err);
      lastError = err;
    }
  }

  throw (
    lastError ||
    new Error("Failed to get response from Workers AI Llama models")
  );
}

export class ChatAgent extends AIChatAgent<Env> {
  maxPersistedMessages = 100;
  chatRecovery = true;

  /**
   * Primary streaming handler for the stateful agent chat.
   * Utilizes Cloudflare Workers AI with Llama 3 instruction models.
   */
  async onChatMessage(_onFinish: unknown, options?: OnChatMessageOptions) {
    const rawMessages = await convertToModelMessages(this.messages);

    // Normalize messages: Workers AI instruction models require string content
    const modelMessages = rawMessages
      .map((msg) => {
        let text = "";
        if (typeof msg.content === "string") {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          text = msg.content
            .map((c: unknown) => {
              if (typeof c === "string") return c;
              if (c && typeof c === "object" && "text" in c) {
                return (c as { text: string }).text || "";
              }
              return "";
            })
            .join("\n");
        } else if (msg.content) {
          text = String(msg.content);
        }
        return {
          role: msg.role as "user" | "assistant" | "system",
          content: text.trim()
        };
      })
      .filter((msg) => msg.content.length > 0);

    const workersai = createWorkersAI({ binding: this.env.AI });
    const primaryModel = LLAMA_CANDIDATE_MODELS[0];
    const sessionAffinity = this.sessionAffinity;
    const env = this.env;

    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute: async ({ writer }) => {
          try {
            const result = streamText({
              model: workersai(primaryModel, {
                sessionAffinity
              }),
              system: HR_SYSTEM_PROMPT,
              messages: modelMessages,
              abortSignal: options?.abortSignal
            });

            writer.merge(result.toUIMessageStream());
          } catch (streamErr) {
            console.warn(
              "streamText failed to initialize, falling back to direct Workers AI run:",
              streamErr
            );

            try {
              const reply = await runLlamaInference(env, [
                { role: "system", content: HR_SYSTEM_PROMPT },
                ...modelMessages.map((m) => ({
                  role: m.role,
                  content: m.content
                }))
              ]);

              writer.write({
                type: "text-delta",
                id: "fallback-text-1",
                delta: reply
              });
            } catch (fallbackErr) {
              console.error("Direct fallback also failed:", fallbackErr);
              writer.write({
                type: "text-delta",
                id: "fallback-text-err",
                delta: "I don't know, please contact HR."
              });
            }
          }
        },
        onError: () => "I don't know, please contact HR."
      })
    });
  }

  /**
   * Callable RPC method allowing direct query from client stub if desired.
   */
  @callable()
  async askQuestion(question: string): Promise<string> {
    return await runLlamaInference(this.env, [
      { role: "system", content: HR_SYSTEM_PROMPT },
      { role: "user", content: question }
    ]);
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // Optional direct REST endpoint for testing Workers AI
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = (await request.json().catch(() => ({}))) as {
          message?: string;
        };
        const message = body.message;
        if (!message) {
          return new Response(
            JSON.stringify({
              error: "Missing message parameter in request body"
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        const reply = await runLlamaInference(env, [
          { role: "system", content: HR_SYSTEM_PROMPT },
          { role: "user", content: message }
        ]);

        return new Response(JSON.stringify({ response: reply }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: unknown) {
        return new Response(
          JSON.stringify({
            error: err instanceof Error ? err.message : String(err)
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;

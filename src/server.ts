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

Rule 1: Strict Accuracy & Mandatory Citation

Answer the user's question accurately using ONLY the facts stated in the Context Document.

Do not invent, infer, or calculate any rules, numbers, or exceptions that are not explicitly written.

Mandatory: You must append the exact section number to the end of every answer in brackets. (Example format: "You are entitled to 20 working days of Annual Leave. [Section 4.1]")

Rule 2: Out of Scope (Zero-Tolerance Fallback)

If a user asks a question that cannot be answered using the provided text (e.g., questions about remote work, salary, hardware, or general advice), you must refuse to answer.

Do not guess. Do not apologize. Do not use introductory phrases like "Based on the policy..." or "I'm sorry, but...".

You must output EXACTLY this exact phrase and nothing else: "I don't know, please contact HR."

Rule 3: Data Privacy Protection

If a user asks for personal information regarding another employee (e.g., "How many leave days has Rahim taken?", "Why is my manager on medical leave?", or "Is John on holiday?"), you must immediately deny the request.

Do not confirm or deny the employee's status.

Use EXACTLY this response: "Leave records are confidential. I cannot share information about other employees. Please contact the HR Department."`;

export const HR_SYSTEM_PROMPT = `${SYSTEM_INSTRUCTIONS}

---
CONTEXT DOCUMENT (XYZ Company Leave Policy):
${LEAVE_POLICY_TEXT}
---`;

export class ChatAgent extends AIChatAgent<Env> {
  maxPersistedMessages = 100;
  chatRecovery = true;

  /**
   * Primary streaming handler for the stateful agent chat.
   * Utilizes Cloudflare Workers AI with Meta Llama 3.1 8B Instruct.
   * Normalizes messages so that string contents are cleanly passed to Workers AI.
   */
  async onChatMessage(_onFinish: unknown, options?: OnChatMessageOptions) {
    // Convert raw persisted messages to model format
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

    try {
      const result = streamText({
        model: workersai("@cf/meta/llama-3.1-8b-instruct", {
          sessionAffinity: this.sessionAffinity
        }),
        system: HR_SYSTEM_PROMPT,
        messages: modelMessages,
        abortSignal: options?.abortSignal
      });

      return result.toUIMessageStreamResponse();
    } catch (err) {
      console.error(
        "streamText failed, falling back to direct env.AI.run:",
        err
      );

      const aiResponse = (await this.env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct",
        {
          messages: [
            { role: "system", content: HR_SYSTEM_PROMPT },
            ...modelMessages.map((m) => ({
              role: m.role,
              content: m.content
            }))
          ]
        }
      )) as { response?: string };

      const responseText =
        aiResponse.response || "I don't know, please contact HR.";

      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute({ writer }) {
            writer.write({
              type: "text-delta",
              id: "msg-1",
              delta: responseText
            });
          }
        })
      });
    }
  }

  /**
   * Callable RPC method allowing direct query from client stub if desired.
   */
  @callable()
  async askQuestion(question: string): Promise<string> {
    const aiResponse = (await this.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages: [
          { role: "system", content: HR_SYSTEM_PROMPT },
          { role: "user", content: question }
        ]
      }
    )) as { response?: string };

    return aiResponse.response || "";
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

        const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: HR_SYSTEM_PROMPT },
            { role: "user", content: message }
          ]
        });

        return new Response(JSON.stringify(aiResponse), {
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

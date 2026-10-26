import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import {
  AtomIcon,
  PaperPlaneRightIcon,
  StopIcon,
  TrashIcon,
  CheckCircleIcon
} from "@phosphor-icons/react";

function ChatContent() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Cloudflare Agent connection
  const agent = useAgent({
    agent: "ChatAgent"
  });

  // Connect stateful chat hooks with automatic persistence in Durable Objects SQLite
  const { messages, sendMessage, clearHistory, stop, status } = useAgentChat({
    agent
  });

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";
  const isWaiting = isStreaming || isSubmitted;

  // Auto-scroll on new messages or streamed tokens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isWaiting]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleSend = useCallback(
    (textToSend?: string) => {
      const query = (textToSend || input).trim();
      if (!query || isWaiting) return;

      sendMessage({
        role: "user",
        parts: [{ type: "text", text: query }]
      });

      if (!textToSend) {
        setInput("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    },
    [input, isWaiting, sendMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine if the last message in history is currently an assistant turn
  const hasAssistantTurn =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header - Dark corporate aesthetic with Atom icon */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md z-30 flex-none">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
          {/* Identity: Atom Icon & Assistant Title */}
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/10 p-2 rounded-xl border border-teal-500/20 flex items-center justify-center">
              <AtomIcon size={24} className="text-teal-400" weight="bold" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
                XYZ Company HR Leave Assistant
              </h1>
              <p className="text-xs text-slate-400">
                Official Leave Policy Advisor
              </p>
            </div>
          </div>

          {/* Header Action: Delete History button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Start a new conversation? This will delete the chat history."
                  )
                ) {
                  clearHistory();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-800/60 transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Delete conversation history"
              disabled={messages.length === 0}
            >
              <TrashIcon size={15} />
              <span>Delete History</span>
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Message History Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 bg-slate-950">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Welcome Screen / Empty State */}
          {messages.length === 0 && (
            <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 text-center my-4 space-y-6">
              <div className="inline-flex p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 shadow-inner">
                <AtomIcon size={38} className="text-teal-400" weight="bold" />
              </div>

              <div className="max-w-xl mx-auto space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                  Welcome to XYZ Company HR Assistant
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  I am your official assistant for XYZ Company&apos;s Leave
                  Policy (HR-POL-004). Ask any question regarding leave
                  entitlements, carry-forward limits, probation rules,
                  application timelines in PeopleHub, or confidentiality.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800/80">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircleIcon size={14} className="text-teal-400" />
                  Mandatory Section Citations
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircleIcon size={14} className="text-teal-400" />
                  Strict Employee Privacy Guard
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircleIcon size={14} className="text-teal-400" />
                  Zero Hallucination Tolerance
                </span>
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((message, msgIdx) => {
            const isUser = message.role === "user";
            const isLastAssistant = !isUser && msgIdx === messages.length - 1;

            // Extract all text content from parts
            const textContent = message.parts
              .filter((p) => p.type === "text")
              .map((p) => (p as { text: string }).text || "")
              .join("");

            const effectiveText = textContent.trim();

            if (isUser) {
              return (
                <div
                  key={message.id || msgIdx}
                  className="flex justify-end items-end gap-2.5 my-1"
                >
                  <div className="bg-slate-800 text-slate-100 border border-slate-700/80 rounded-2xl rounded-br-xs px-4 py-3 max-w-[85%] sm:max-w-[75%] shadow-xs">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {textContent}
                    </p>
                  </div>
                  <div className="flex-none w-7 h-7 rounded-full bg-slate-700 border border-slate-600 text-slate-200 flex items-center justify-center font-bold text-[10px] shadow-xs">
                    You
                  </div>
                </div>
              );
            }

            // Assistant Message Bubble
            return (
              <div
                key={message.id || msgIdx}
                className="flex justify-start items-start gap-2.5 my-2"
              >
                <div className="flex-none w-8 h-8 rounded-full bg-teal-950 border border-teal-600/50 text-teal-300 flex items-center justify-center font-bold text-xs shadow-xs mt-0.5">
                  HR
                </div>

                <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3.5 shadow-sm max-w-[90%] sm:max-w-[80%]">
                  {/* Assistant Header - Clean title with NO HR-POL-004 badge */}
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
                    <span className="text-xs font-semibold text-teal-400">
                      XYZ HR Assistant
                    </span>
                  </div>

                  {/* Assistant Body */}
                  {effectiveText.length > 0 ? (
                    <Streamdown
                      className="dark-markdown text-slate-200 text-sm leading-relaxed"
                      plugins={{ code }}
                      controls={false}
                      isAnimating={isLastAssistant && isStreaming}
                    >
                      {effectiveText}
                    </Streamdown>
                  ) : isWaiting ? (
                    /* Pulsing typing indicator */
                    <div className="flex items-center gap-2 text-teal-400 text-xs font-medium py-1">
                      <div className="flex gap-1 items-center">
                        <span
                          className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                      <span>Consulting leave policy...</span>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic">
                      I don&apos;t know, please contact HR.
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Fallback loading indicator if turn just began */}
          {isWaiting && !hasAssistantTurn && (
            <div className="flex justify-start items-start gap-2.5 my-2">
              <div className="flex-none w-8 h-8 rounded-full bg-teal-950 border border-teal-600/50 text-teal-300 flex items-center justify-center font-bold text-xs shadow-xs mt-0.5">
                HR
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-teal-400 text-xs font-medium">
                  <div className="flex gap-1 items-center">
                    <span
                      className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span>Consulting leave policy...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Sticky Input Bar at Bottom */}
      <footer className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 md:py-4 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-end gap-2 sm:gap-3 bg-slate-900 border border-slate-800 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 rounded-2xl p-2 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about XYZ Company Leave Policy (e.g., annual leave, sick leave, carry forward rules)..."
              rows={1}
              disabled={isWaiting}
              className="flex-1 bg-transparent border-0 outline-none resize-none px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 max-h-36 min-h-[38px] leading-relaxed"
            />

            {isWaiting ? (
              <button
                type="button"
                onClick={stop}
                className="flex-none p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shadow-xs cursor-pointer"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <StopIcon size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex-none p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Send message"
                aria-label="Send message"
              >
                <PaperPlaneRightIcon size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span>
              Press <strong>Enter</strong> to send,{" "}
              <strong>Shift + Enter</strong> for newline
            </span>
            <span>XYZ Company HR Assistant</span>
          </div>
        </form>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-slate-400 gap-3">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading XYZ HR Assistant...</p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

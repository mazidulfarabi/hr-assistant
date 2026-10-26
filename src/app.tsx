import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import {
  PaperPlaneRightIcon,
  StopIcon,
  TrashIcon,
  InfoIcon,
  CheckCircleIcon,
  FileTextIcon,
  SparkleIcon,
  ShieldCheckIcon
} from "@phosphor-icons/react";

const SUGGESTED_QUESTIONS = [
  "How many days of Annual Leave am I entitled to each year?",
  "What is the procedure and notice required for Sick Leave?",
  "How many unused leave days can I carry forward to next year?",
  "Can employees on probation take Casual Leave or Annual Leave?",
  "What is the policy for Maternity and Paternity Leave?",
  "What are the weekly holidays at XYZ Company?"
];

function PolicyModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileTextIcon size={24} className="text-teal-300" />
            <div>
              <h3 className="font-bold text-lg">XYZ Company Leave Policy</h3>
              <p className="text-xs text-blue-200">
                HR-POL-004 • Version 2.0 • Effective 1 Jan 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 leading-relaxed">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
            <p className="font-medium">
              This assistant adheres strictly to{" "}
              <strong>XYZ Company Policy HR-POL-004</strong>. All responses cite
              the exact section number and adhere to strict privacy rules.
            </p>
          </div>

          <h4 className="font-semibold text-slate-900 border-b pb-1 text-base">
            Key Leave Entitlements Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-semibold text-slate-900">
                Annual Leave:
              </span>{" "}
              20 working days/year (accrues 1.67 days/month). Max 10 carry
              forward until 31 Mar. [Sec 4.1]
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-semibold text-slate-900">
                Casual Leave:
              </span>{" "}
              8 working days/year. Max 3 consecutive days. Cannot carry forward.
              [Sec 4.2]
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-semibold text-slate-900">Sick Leave:</span>{" "}
              12 working days/year. Medical cert required if &gt; 2 consecutive
              days. [Sec 4.3]
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-semibold text-slate-900">
                Maternity & Paternity:
              </span>{" "}
              16 weeks maternity (after 6 mo service). 7 calendar days
              paternity. [Sec 4.4, 4.5]
            </div>
          </div>

          <h4 className="font-semibold text-slate-900 border-b pb-1 text-base">
            Core Assistance Rules
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>
              <strong>Mandatory Citations:</strong> Answers always include
              section citations (e.g. [Section 4.1]).
            </li>
            <li>
              <strong>Strict Fallback:</strong> Out-of-scope inquiries return:{" "}
              <em>"I don't know, please contact HR."</em>
            </li>
            <li>
              <strong>Data Privacy:</strong> Queries regarding other employee
              records are strictly denied.
            </li>
          </ul>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatContent() {
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize the Cloudflare Agent connection with connection listeners
  const agent = useAgent({
    agent: "ChatAgent",
    onOpen: useCallback(() => setConnected(true), []),
    onClose: useCallback(() => setConnected(false), []),
    onError: useCallback(() => setConnected(false), [])
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

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Policy Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
      />

      {/* STEP 5: Fixed Header */}
      <header className="bg-blue-900 text-white shadow-md z-30 flex-none border-b border-blue-950">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
          {/* Logo & Assistant Identity */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1 rounded-xl border border-white/20 backdrop-blur-xs flex items-center justify-center">
              <img
                src="/xyz.png"
                alt="XYZ Company Logo"
                className="h-8 sm:h-9 w-auto object-contain"
                onError={(e) => {
                  // Fallback in case of image load delay
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                XYZ Company HR Leave Assistant
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  <ShieldCheckIcon size={12} />
                  HR-POL-004
                </span>
              </h1>
              <p className="text-xs text-blue-200">
                Official Leave Policy Advisor • Cloudflare Workers AI
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Connection Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                connected
                  ? "bg-teal-900/60 border-teal-500/40 text-teal-200"
                  : "bg-amber-900/50 border-amber-500/40 text-amber-200"
              }`}
              title={
                connected
                  ? "Connected to Cloudflare Agent"
                  : "Connecting to Agent..."
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-teal-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="hidden md:inline">
                {connected ? "Connected" : "Connecting"}
              </span>
            </div>

            {/* Policy Info Button */}
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-800/80 hover:bg-blue-700/80 text-blue-100 border border-blue-700/60 transition-colors shadow-xs"
              title="View Policy Summary"
            >
              <InfoIcon size={15} />
              <span className="hidden sm:inline">Policy</span>
            </button>

            {/* Clear History Button */}
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Start a new conversation? This will clear the chat history."
                  )
                ) {
                  clearHistory();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-800/80 hover:bg-rose-900/80 text-blue-100 hover:text-white border border-blue-700/60 hover:border-rose-700/60 transition-colors shadow-xs"
              title="Clear conversation history"
              disabled={messages.length === 0}
            >
              <TrashIcon size={15} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* STEP 5: Scrollable Message History Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Welcome Screen / Empty State */}
          {messages.length === 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 text-center my-4 space-y-6">
              <div className="inline-flex p-3 rounded-2xl bg-blue-50 border border-blue-100 shadow-inner">
                <img
                  src="/xyz.png"
                  alt="XYZ Company"
                  className="h-12 w-auto object-contain"
                />
              </div>

              <div className="max-w-xl mx-auto space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Welcome to XYZ Company HR Assistant
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  I am your official assistant for XYZ Company&apos;s Leave
                  Policy (HR-POL-004). I can answer all questions regarding your
                  leave entitlements, probation guidelines, application
                  timelines in PeopleHub, carry-forward limits, and
                  confidentiality.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Suggested Questions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-2xl mx-auto">
                  {SUGGESTED_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(question)}
                      className="p-3 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 hover:bg-teal-50/80 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-xl transition-all duration-150 flex items-start gap-2 shadow-2xs group"
                    >
                      <SparkleIcon
                        size={16}
                        className="text-teal-600 mt-0.5 flex-none group-hover:scale-110 transition-transform"
                      />
                      <span>{question}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <CheckCircleIcon size={14} className="text-teal-600" />
                  Mandatory Section Citations
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircleIcon size={14} className="text-teal-600" />
                  Strict Employee Privacy Guard
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircleIcon size={14} className="text-teal-600" />
                  Workers AI (@cf/meta/llama-3.1-8b-instruct)
                </span>
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((message, msgIdx) => {
            const isUser = message.role === "user";
            const isLastAssistant = !isUser && msgIdx === messages.length - 1;

            return (
              <div
                key={message.id || msgIdx}
                className={`flex gap-3 items-start ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="flex-none w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs mt-1">
                    HR
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative px-4 py-3.5 rounded-2xl shadow-xs transition-all ${
                    isUser
                      ? "bg-slate-200/90 text-slate-800 border border-slate-300/80 rounded-tr-xs max-w-[85%] sm:max-w-[75%]"
                      : "bg-teal-50/90 text-slate-800 border border-teal-200 rounded-tl-xs max-w-[90%] sm:max-w-[80%]"
                  }`}
                >
                  {/* Sender identity & timestamp */}
                  <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-black/5">
                    <span className="text-[11px] font-semibold tracking-wide text-slate-500">
                      {isUser ? "You" : "XYZ HR Assistant"}
                    </span>
                    {!isUser && (
                      <span className="text-[10px] text-teal-800/80 font-medium bg-teal-100/70 px-1.5 py-0.5 rounded">
                        HR-POL-004
                      </span>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="text-sm leading-relaxed space-y-2">
                    {message.parts.map((part, pIdx) => {
                      if (part.type === "text") {
                        return (
                          <Streamdown
                            key={pIdx}
                            className="prose prose-sm max-w-none text-slate-800 prose-p:my-1 prose-headings:my-2 prose-ul:my-1"
                            plugins={{ code }}
                            controls={false}
                            isAnimating={isLastAssistant && isStreaming}
                          >
                            {part.text}
                          </Streamdown>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="flex-none w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-semibold text-xs shadow-xs mt-1">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {/* STEP 5: Visual Loading State */}
          {isWaiting && (
            <div className="flex gap-3 items-start justify-start animate-fade-in">
              <div className="flex-none w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs mt-1">
                HR
              </div>
              <div className="bg-teal-50/90 border border-teal-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                <div className="flex items-center gap-2 text-teal-800 text-xs font-medium">
                  <div className="flex gap-1 items-center">
                    <span
                      className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span>HR Assistant is consulting policy...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* STEP 5: Sticky Input Bar at Bottom */}
      <footer className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 md:py-4 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-end gap-2 sm:gap-3 bg-slate-50 border border-slate-300 focus-within:border-blue-800 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl p-2 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about XYZ Company Leave Policy (e.g., annual leave, sick leave, carry forward rules)..."
              rows={1}
              disabled={isWaiting}
              className="flex-1 bg-transparent border-0 outline-none resize-none px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 max-h-36 min-h-[38px] leading-relaxed"
            />

            {isWaiting ? (
              <button
                type="button"
                onClick={stop}
                className="flex-none p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors shadow-xs"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <StopIcon size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || !connected}
                className="flex-none p-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send message"
                aria-label="Send message"
              >
                <PaperPlaneRightIcon size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>
              Press <strong>Enter</strong> to send,{" "}
              <strong>Shift + Enter</strong> for newline
            </span>
            <span>XYZ Company HR Assistant • Cloudflare Workers AI</span>
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
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-100 text-slate-500 gap-3">
          <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading XYZ HR Assistant...</p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

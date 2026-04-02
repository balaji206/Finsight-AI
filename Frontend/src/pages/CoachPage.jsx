/**
 * CoachPage.jsx — AI Financial Coach Chat Interface
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-height iMessage-style chat with:
 *   • Real-time Gemini streaming (fetch + ReadableStream, token-by-token)
 *   • User messages: right-aligned emerald bubbles
 *   • Assistant messages: left-aligned white cards with markdown rendering
 *   • Animated typing indicator (three bouncing dots) while awaiting first token
 *   • Blinking cursor while stream is in progress
 *   • Scrollable SDG suggestion chips below the input
 *   • Textarea with Enter-to-send and auto-resize
 *   • Chat history loads on mount, auto-scrolls to latest message
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Send, Trash2, Bot, User, RefreshCw, Sparkles } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── SDG Suggestion Chips ────────────────────────────────────────────────────
const SDG_CHIPS = [
  "How do I invest sustainably?",
  "Which of my goals supports SDG 4 Education?",
  "Show spending that helps SDG 5 Gender Equality",
  "What's my carbon footprint from transport spending?",
  "How can I improve my SDG score?",
  "Give me a monthly savings plan aligned with SDGs",
];

// ─── Simple Markdown Renderer ─────────────────────────────────────────────────
/**
 * Renders basic markdown to React elements — no external dependencies needed.
 * Supports: # headers, **bold**, *italic*, `code`, - bullet lists, --- dividers.
 */
function MarkdownText({ text }) {
  /** Parse inline formatting: **bold**, *italic*, `code` */
  const parseInline = (str) => {
    if (!str) return null;
    // Split on bold, italic, and inline-code patterns (bold checked first)
    const parts = str.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (
        part.startsWith("*") &&
        part.endsWith("*") &&
        part.length > 2 &&
        !part.startsWith("**")
      ) {
        return (
          <em key={i} className="italic text-gray-600">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={i}
            className="bg-gray-100 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const lines = text.split("\n");

  return (
    <div className="text-gray-700 leading-relaxed space-y-0.5">
      {lines.map((line, idx) => {
        // Heading levels
        if (line.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-sm font-bold text-gray-800 mt-3 mb-0.5">
              {parseInline(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={idx} className="text-base font-bold text-gray-800 mt-3 mb-1">
              {parseInline(line.slice(3))}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2 key={idx} className="text-lg font-bold text-gray-900 mt-3 mb-1">
              {parseInline(line.slice(2))}
            </h2>
          );
        }
        // Horizontal rule
        if (line === "---" || line === "___" || line === "***") {
          return <hr key={idx} className="my-3 border-gray-200" />;
        }
        // Bullet points
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-indigo-400 font-bold mt-0.5 flex-shrink-0 text-xs">
                ●
              </span>
              <span className="text-sm">{parseInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line.startsWith("* ")) {
          return (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-indigo-400 font-bold mt-0.5 flex-shrink-0 text-xs">
                ●
              </span>
              <span className="text-sm">{parseInline(line.slice(2))}</span>
            </div>
          );
        }
        // Numbered list
        const numberedMatch = line.match(/^(\d+)\. (.+)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-indigo-500 font-semibold text-xs mt-0.5 flex-shrink-0 min-w-[1.2rem]">
                {numberedMatch[1]}.
              </span>
              <span className="text-sm">{parseInline(numberedMatch[2])}</span>
            </div>
          );
        }
        // Empty line — small spacer
        if (line === "") {
          return <div key={idx} className="h-1.5" />;
        }
        // Regular paragraph
        return (
          <p key={idx} className="text-sm leading-relaxed">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2 mb-3">
        <div className="max-w-[75%] bg-emerald-500 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        </div>
        <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-emerald-600" />
        </div>
      </div>
    );
  }

  // Assistant bubble
  return (
    <div className="flex justify-start items-end gap-2 mb-3">
      <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-white" />
      </div>
      <div className="max-w-[80%] bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        {/* Show typing indicator when stream starts but no content yet */}
        {msg.streaming && msg.content === "" ? (
          <TypingIndicator />
        ) : (
          <div>
            <MarkdownText text={msg.content} />
            {/* Blinking cursor while streaming */}
            {msg.streaming && (
              <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle rounded" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main CoachPage ───────────────────────────────────────────────────────────
export default function CoachPage() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(true);
  const [isStreaming, setIsStreaming]  = useState(false);
  const [error, setError]             = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // Auto-scroll to the latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 128) + "px";
    }
  }, [input]);

  // ── Load chat history on mount ──────────────────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/coach/history`);
        setMessages(res.data.data || []);
      } catch (err) {
        setError("Failed to load chat history. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  // ── Send a message (handles both text input and chip clicks) ────────────────
  const sendMessage = useCallback(
    async (textOverride) => {
      const msg = (textOverride !== undefined ? textOverride : input).trim();
      if (!msg || isStreaming) return;

      setInput("");
      setError("");
      setIsStreaming(true);
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      // Optimistic UI: show user message immediately
      const tempUserId = `temp-user-${Date.now()}`;
      const tempAsstId = `temp-asst-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { _id: tempUserId, role: "user", content: msg },
        { _id: tempAsstId, role: "assistant", content: "", streaming: true },
      ]);

      try {
        // Use fetch (not axios) to support ReadableStream
        const response = await fetch(`${API_URL}/api/coach/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        if (!response.body) {
          throw new Error("No readable stream in response");
        }

        // Read the stream token by token and append to the streaming message
        const reader  = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const token = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?._id === tempAsstId) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + token,
              };
            }
            return updated;
          });
        }
      } catch (err) {
        console.error("CoachPage.sendMessage:", err);
        setError("Failed to get a response. Please try again.");
        // Remove the failed streaming placeholder
        setMessages((prev) =>
          prev.filter((m) => m._id !== tempAsstId)
        );
      } finally {
        // Mark streaming complete (removes blinking cursor)
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempAsstId ? { ...m, streaming: false } : m
          )
        );
        setIsStreaming(false);
      }
    },
    [input, isStreaming]
  );

  // ── Enter key handler (Shift+Enter = newline, Enter = send) ────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Clear history ───────────────────────────────────────────────────────────
  const handleClearHistory = async () => {
    if (!confirm("Clear all chat history? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/api/coach/history`);
      setMessages([]);
      // Re-fetch to get the welcome messages re-seeded
      const res = await axios.get(`${API_URL}/api/coach/history`);
      setMessages(res.data.data || []);
    } catch (err) {
      setError("Failed to clear history.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Gradient avatar */}
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-sm">
            <Bot size={18} className="text-white" />
            {/* Live pulse dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              FinSight Coach
            </h1>
            <p className="text-xs text-indigo-500 flex items-center gap-1">
              <Sparkles size={10} />
              Gemini-powered · SDG-aware · Personalised
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          disabled={isStreaming}
          className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-30"
          title="Clear chat history"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-2">

        {/* Loading spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading your chat history…</p>
          </div>
        )}

        {/* Messages */}
        {!loading && (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <MessageBubble key={msg._id || idx} msg={msg} />
            ))}

            {/* Error banner */}
            {error && (
              <div className="text-center text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl py-2 px-4 mx-auto max-w-sm my-3">
                ⚠️ {error}
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* ── SDG Suggestion Chips ── */}
      <div className="bg-white border-t border-gray-100 px-4 pt-2.5 pb-1 flex-shrink-0">
        <div
          className="flex gap-2 overflow-x-auto pb-1.5"
          style={{ scrollbarWidth: "none" }}
        >
          {SDG_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              disabled={isStreaming}
              className="flex-shrink-0 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 
                         px-3 py-1.5 rounded-full hover:bg-indigo-100 hover:border-indigo-200 
                         transition-all disabled:opacity-40 whitespace-nowrap font-medium"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-2.5 max-w-3xl mx-auto">
          {/* Auto-resizing textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your financial coach… (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none 
                       focus:ring-2 focus:ring-indigo-400 text-sm resize-none bg-gray-50 
                       disabled:bg-gray-100 transition-all leading-relaxed"
            style={{ minHeight: "48px", maxHeight: "128px", overflowY: "auto" }}
          />

          {/* Send / loading button */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 
                       transition-all shadow-sm
                       bg-indigo-600 hover:bg-indigo-700 text-white
                       disabled:bg-gray-200 disabled:shadow-none"
            title="Send message"
          >
            {isStreaming ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        {/* Disclaimer note */}
        <p className="text-center text-xs text-gray-400 mt-2 leading-relaxed">
          FinSight Coach uses AI and your financial data. Always verify decisions with a{" "}
          <span className="text-indigo-400">SEBI-registered advisor</span>.
        </p>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Send, Trash2, RefreshCw, Sparkles } from "lucide-react";
import "./CoachPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SDG_CHIPS = [
  "How do I invest sustainably?",
  "Which of my goals supports SDG 4 Education?",
  "Show spending that helps SDG 5 Gender Equality",
  "What's my carbon footprint from transport spending?",
  "How can I improve my SDG score?",
  "Give me a monthly savings plan aligned with SDGs",
];

// Simple markdown renderer — B&W only
function MarkdownText({ text }) {
  const parseInline = (str) => {
    if (!str) return null;
    const parts = str.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
        return <strong key={i} style={{ color: '#fff', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**"))
        return <em key={i} style={{ color: 'rgba(255,255,255,0.7)' }}>{part.slice(1, -1)}</em>;
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
        return <code key={i} className="coach-inline-code">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  return (
    <div className="coach-md">
      {text.split("\n").map((line, idx) => {
        if (line.startsWith("### ")) return <h4 key={idx} className="coach-md-h4">{parseInline(line.slice(4))}</h4>;
        if (line.startsWith("## "))  return <h3 key={idx} className="coach-md-h3">{parseInline(line.slice(3))}</h3>;
        if (line.startsWith("# "))   return <h2 key={idx} className="coach-md-h2">{parseInline(line.slice(2))}</h2>;
        if (line === "---")           return <hr key={idx} className="coach-md-hr" />;
        if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* "))
          return <div key={idx} className="coach-md-li"><span className="coach-md-bullet">—</span><span>{parseInline(line.slice(2))}</span></div>;
        const num = line.match(/^(\d+)\. (.+)/);
        if (num) return <div key={idx} className="coach-md-li"><span className="coach-md-num">{num[1]}.</span><span>{parseInline(num[2])}</span></div>;
        if (line === "") return <div key={idx} style={{ height: '0.5rem' }} />;
        return <p key={idx} className="coach-md-p">{parseInline(line)}</p>;
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="coach-typing">
      {[0, 0.15, 0.3].map((d, i) => (
        <span key={i} className="coach-dot" style={{ animationDelay: `${d}s` }} />
      ))}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`coach-msg ${isUser ? 'coach-msg-user' : 'coach-msg-ai'}`}>
      {!isUser && <div className="coach-avatar"><Sparkles size={13} /></div>}
      <div className={`coach-bubble ${isUser ? 'coach-bubble-user' : 'coach-bubble-ai'}`}>
        {!isUser && msg.streaming && msg.content === "" ? (
          <TypingDots />
        ) : (
          <>
            {isUser
              ? <p className="coach-user-text">{msg.content}</p>
              : <MarkdownText text={msg.content} />
            }
            {msg.streaming && <span className="coach-cursor" />}
          </>
        )}
      </div>
    </div>
  );
}

export default function CoachPage() {
  const [messages, setMessages]      = useState([]);
  const [input, setInput]            = useState("");
  const [loading, setLoading]        = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError]            = useState("");

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  useEffect(() => {
    axios.get(`${API_URL}/api/coach/history`)
      .then(r => setMessages(r.data.data || []))
      .catch(() => setError("Failed to load chat history. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  const sendMessage = useCallback(async (override) => {
    const msg = (override !== undefined ? override : input).trim();
    if (!msg || isStreaming) return;
    setInput(""); setError(""); setIsStreaming(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const uid = `u-${Date.now()}`, aid = `a-${Date.now()}`;
    setMessages(p => [...p,
      { _id: uid, role: "user", content: msg },
      { _id: aid, role: "assistant", content: "", streaming: true }
    ]);

    try {
      const res = await fetch(`${API_URL}/api/coach/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok || !res.body) throw new Error("Stream error");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const token = dec.decode(value, { stream: true });
        setMessages(p => p.map(m => m._id === aid ? { ...m, content: m.content + token } : m));
      }
    } catch {
      setError("Failed to get a response. Please try again.");
      setMessages(p => p.filter(m => m._id !== aid));
    } finally {
      setMessages(p => p.map(m => m._id === aid ? { ...m, streaming: false } : m));
      setIsStreaming(false);
    }
  }, [input, isStreaming]);

  const clearHistory = async () => {
    if (!confirm("Clear all chat history?")) return;
    try {
      await axios.delete(`${API_URL}/api/coach/history`);
      const r = await axios.get(`${API_URL}/api/coach/history`);
      setMessages(r.data.data || []);
    } catch { setError("Failed to clear history."); }
  };

  return (
    <div className="coach-root">
      {/* Page header strip */}
      <div className="coach-header">
        <div className="coach-header-left">
          <div className="coach-header-icon"><Sparkles size={14} /></div>
          <div>
            <h1 className="coach-header-title">FinSight Coach</h1>
            <p className="coach-header-sub">Gemini-powered · SDG-aware · Personalised</p>
          </div>
        </div>
        <button onClick={clearHistory} disabled={isStreaming} className="coach-clear-btn" title="Clear history">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="coach-messages">
        {loading ? (
          <div className="coach-loading">
            <div className="coach-spinner" />
            <p>Loading conversation…</p>
          </div>
        ) : (
          <div className="coach-messages-inner">
            {messages.map((msg, i) => <MessageBubble key={msg._id || i} msg={msg} />)}
            {error && <div className="coach-error">⚠ {error}</div>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* SDG chips */}
      <div className="coach-chips-bar">
        {SDG_CHIPS.map(chip => (
          <button key={chip} onClick={() => sendMessage(chip)} disabled={isStreaming} className="coach-chip">
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="coach-input-bar">
        <div className="coach-input-inner">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask your financial coach… (Enter to send)"
            rows={1}
            disabled={isStreaming}
            className="coach-textarea"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="coach-send-btn"
          >
            {isStreaming ? <RefreshCw size={15} className="spin" /> : <Send size={15} />}
          </button>
        </div>
        <p className="coach-disclaimer">
          FinSight Coach uses AI and your financial data. Always verify with a SEBI-registered advisor.
        </p>
      </div>
    </div>
  );
}

// frontend/src/dashboard/AIChatbot.jsx
// ── Kite AI — Stock Analysis Chatbot ─────────────────────
// Floating chat widget that uses the user's live portfolio as context

import { useState, useRef, useEffect, useCallback } from "react";
import api from "../utils/api";

// ── Tiny markdown renderer (bold + bullets only) ──────────
function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Bullet point
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      const bullets = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("• "))
      ) {
        bullets.push(lines[i].trim().replace(/^[-•]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={i} style={{ margin: "6px 0", paddingLeft: 18 }}>
          {bullets.map((b, j) => (
            <li key={j} style={{ marginBottom: 3, fontSize: 13.5 }}>
              {renderInline(b)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} style={{ margin: "4px 0", fontSize: 13.5, lineHeight: 1.6 }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function renderInline(text) {
  // **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ── Suggested quick prompts ───────────────────────────────
const QUICK_PROMPTS = [
  "Analyse my portfolio",
  "Which of my stocks are at a loss?",
  "Am I over-invested in any sector?",
  "Explain my biggest holding",
  "Should I diversify more?",
  "What is stop-loss and how do I use it?",
];

// ── Message bubble ────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
        gap: 8,
        alignItems: "flex-end",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #387ed1, #1e3a8a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(56,126,209,0.3)",
          }}
        >
          ✦
        </div>
      )}

      <div
        style={{
          maxWidth: "80%",
          padding: isUser ? "9px 14px" : "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, #387ed1, #2b6cb8)"
            : "#f4f7fb",
          color: isUser ? "#fff" : "#1a1a2e",
          boxShadow: isUser
            ? "0 2px 8px rgba(56,126,209,0.25)"
            : "0 1px 3px rgba(0,0,0,0.06)",
          wordBreak: "break-word",
        }}
      >
        {isUser ? (
          <p style={{ margin: 0, fontSize: 13.5 }}>{msg.content}</p>
        ) : (
          renderMarkdown(msg.content)
        )}
        <div
          style={{
            fontSize: 10,
            opacity: 0.55,
            marginTop: 4,
            textAlign: "right",
          }}
        >
          {new Date(msg.time).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
      <div
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, #387ed1, #1e3a8a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, flexShrink: 0,
        }}
      >
        ✦
      </div>
      <div
        style={{
          padding: "12px 16px",
          background: "#f4f7fb",
          borderRadius: "16px 16px 16px 4px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          display: "flex", gap: 5, alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#387ed1", opacity: 0.6,
              animation: "aiDot 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Chatbot Component ────────────────────────────────
export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm **Kite AI**, your personal trading assistant. I can see your live portfolio and help you understand your holdings, analyse performance, explain market concepts, and much more.\n\nWhat would you like to know?",
      time: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      setInput("");
      setError("");
      const userMsg = { role: "user", content: msg, time: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      // Build history for context (last 10 messages, exclude initial greeting)
      const history = messages
        .slice(1) // skip initial greeting
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const { data } = await api.post("/ai/chat", {
          message: msg,
          history,
        });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, time: Date.now() },
        ]);

        // Show badge if chat is minimized or closed
        if (!isOpen || isMinimized) setHasNewMsg(true);
      } catch (err) {
        const errMsg =
          err.response?.data?.message ||
          "Couldn't reach Kite AI. Please try again.";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, isOpen, isMinimized]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasNewMsg(false);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared! I still have access to your live portfolio. How can I help you?",
        time: Date.now(),
      },
    ]);
    setError("");
  };

  return (
    <>
      {/* ── Global keyframe styles ── */}
      <style>{`
        @keyframes aiDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes aiSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes aiBadgePop {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes aiPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(56,126,209,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(56,126,209,0); }
        }
        .ai-send-btn:hover { background: #2b6cb8 !important; }
        .ai-quick-btn:hover { background: #387ed1 !important; color: #fff !important; border-color: #387ed1 !important; }
        .ai-clear-btn:hover { background: #fff5f5 !important; color: #e74c3c !important; }
        .ai-input:focus { border-color: #387ed1 !important; box-shadow: 0 0 0 3px rgba(56,126,209,0.1) !important; }
        /* ── Responsive chat window ── */
        @media (max-width: 480px) {
          .ai-chat-window {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 18px 18px 0 0 !important;
            height: 88vh !important;
          }
          .ai-trigger-btn {
            bottom: 16px !important;
            right: 16px !important;
          }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .ai-chat-window {
            width: calc(100vw - 32px) !important;
            max-width: 420px !important;
            right: 16px !important;
            bottom: 16px !important;
          }
          .ai-trigger-btn {
            bottom: 16px !important;
            right: 16px !important;
          }
        }
      `}</style>

      {/* ── Floating trigger button ── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="ai-trigger-btn"
          title="Open Kite AI"
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #387ed1 0%, #1e3a8a 100%)",
            border: "none",
            color: "#fff",
            fontSize: 22,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(56,126,209,0.45)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            animation: "aiPulse 2.5s infinite",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.animation = "none";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.animation = "aiPulse 2.5s infinite";
          }}
        >
          ✦
          {hasNewMsg && (
            <div
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#e74c3c",
                border: "2px solid #fff",
                animation: "aiBadgePop 0.3s ease",
              }}
            />
          )}
        </button>
      )}

      {/* ── Chat window ── */}
      {isOpen && (
        <div
          className="ai-chat-window"
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            width: 400,
            height: isMinimized ? "auto" : 580,
            borderRadius: 18,
            background: "#fff",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(56,126,209,0.12)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "aiSlideUp 0.25s ease",
            border: "1px solid rgba(56,126,209,0.15)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #387ed1 0%, #1e3a8a 100%)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
                border: "1.5px solid rgba(255,255,255,0.3)",
              }}
            >
              ✦
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "-0.2px" }}>
                Kite AI
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                Portfolio-aware assistant
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={clearChat}
                className="ai-clear-btn"
                title="Clear chat"
                style={{
                  width: 30, height: 30,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "0.15s ease",
                }}
              >
                ↺
              </button>
              <button
                onClick={() => setIsMinimized((v) => !v)}
                title={isMinimized ? "Expand" : "Minimise"}
                style={{
                  width: 30, height: 30,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#fff",
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "0.15s ease",
                }}
              >
                {isMinimized ? "▲" : "▼"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  width: 30, height: 30,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#fff",
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "0.15s ease",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body — hidden when minimized */}
          {!isMinimized && (
            <>
              {/* Messages area */}
              <div
                ref={chatBodyRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 16px 8px",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#e2e8f0 transparent",
                }}
              >
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}
                {loading && <TypingIndicator />}
                {error && (
                  <div
                    style={{
                      background: "#fff5f5",
                      border: "1px solid #fed7d7",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#c53030",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts — shown only at start */}
              {messages.length <= 1 && (
                <div style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      className="ai-quick-btn"
                      onClick={() => sendMessage(p)}
                      disabled={loading}
                      style={{
                        padding: "5px 11px",
                        borderRadius: 99,
                        border: "1.5px solid #387ed1",
                        background: "#fff",
                        color: "#387ed1",
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "0.15s ease",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div
                style={{
                  padding: "12px 14px",
                  borderTop: "1px solid #eef0f4",
                  background: "#fafbfd",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-end",
                }}
              >
                <textarea
                  ref={inputRef}
                  className="ai-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your portfolio…"
                  disabled={loading}
                  rows={1}
                  style={{
                    flex: 1,
                    resize: "none",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "9px 12px",
                    fontSize: 13.5,
                    fontFamily: "inherit",
                    color: "#1a1a2e",
                    background: "#fff",
                    outline: "none",
                    transition: "0.15s ease",
                    maxHeight: 100,
                    lineHeight: 1.5,
                  }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="ai-send-btn"
                  title="Send (Enter)"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background:
                      loading || !input.trim()
                        ? "#c5d9f0"
                        : "linear-gradient(135deg, #387ed1, #2b6cb8)",
                    border: "none",
                    color: "#fff",
                    fontSize: 16,
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "0.15s ease",
                    flexShrink: 0,
                  }}
                >
                  {loading ? (
                    <div
                      style={{
                        width: 16, height: 16,
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                  ) : (
                    "↑"
                  )}
                </button>
              </div>

              {/* Footer note */}
              <div
                style={{
                  padding: "6px 16px 10px",
                  background: "#fafbfd",
                  textAlign: "center",
                  fontSize: 10.5,
                  color: "#aaa",
                }}
              >
                ✦ Powered by Gemini AI · For educational purposes only · Not financial advice
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
"use client";

import React, { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/components/RoleContext";
import { api, ChatMessage } from "@/services/api";
import {
  Bot,
  Send,
  User,
  Sparkles,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function AssistantPage() {
  const { analysis, setSelectedEvidenceId } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello, I am **AirGuard AI**, your civic environmental intelligence assistant. I am grounded in your validated monitoring dataset. Ask me about ward rankings, particulate trends, data quality limitations, role-specific guidelines, or multilingual citizen advisories.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Which ward has the highest PM2.5 concentration?",
    "Which areas are getting worse?",
    "What immediate steps should school administrators take?",
    "What data limitations were flagged in this audit?",
    "Generate a Hindi citizen advisory for vulnerable residents.",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: q.trim() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await api.sendChatMessage(
        analysis?.analysis_id || "latest",
        q.trim(),
        updatedHistory
      );
      setMessages([
        ...updatedHistory,
        {
          role: "assistant",
          content: res.response,
          evidence_ids: res.referenced_evidence_ids,
        },
      ]);
    } catch (err) {
      setMessages([
        ...updatedHistory,
        {
          role: "assistant",
          content:
            "⚠️ Unable to query AI assistant. Ensure the backend engine is running on localhost:8000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="pb-3 border-b border-surfaceBorder flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Bot className="w-6 h-6 text-primary" />
              <span>Ask AirGuard AI Assistant</span>
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Conversational intelligence strictly grounded in your validated civic dataset
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Hallucination Protocol</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center flex-shrink-0 shadow-glow">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-2xl text-xs leading-relaxed ${
                    isUser
                      ? "bg-primary text-background font-medium"
                      : "bg-surfaceCard border border-surfaceBorder text-foreground"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Render cited evidence pills if any */}
                  {m.evidence_ids && m.evidence_ids.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-surfaceBorder/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-muted">Cited Audit Telemetry:</span>
                      {m.evidence_ids.map((eid) => (
                        <button
                          key={eid}
                          onClick={() => setSelectedEvidenceId(eid)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-surfaceBorder hover:border-secondary text-secondary text-[10px] font-mono transition-colors"
                        >
                          <span>{eid}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-surfaceCard border border-surfaceBorder text-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-surfaceCard border border-surfaceBorder text-xs text-muted flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Grounding query with verified telemetry...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        <div className="py-2 flex flex-wrap items-center gap-1.5 border-t border-surfaceBorder/60">
          <span className="text-[11px] text-muted mr-1">Suggested:</span>
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-surfaceCard border border-surfaceBorder hover:border-primary/40 text-muted hover:text-foreground transition-colors text-left"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question about ward rankings, particulate escalation, or citizen safety..."
            className="flex-1 p-3 rounded-xl bg-surfaceCard border border-surfaceBorder text-xs text-foreground placeholder:text-muted outline-none focus:border-primary"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-primary hover:bg-primary-hover text-background shadow-glow transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

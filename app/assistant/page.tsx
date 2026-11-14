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
  Wrench,
  Zap,
} from "lucide-react";

interface AgentToolExecution {
  tool: string;
  parameters: Record<string, any>;
}

interface ExtendedChatMessage extends ChatMessage {
  executed_tools?: AgentToolExecution[];
  agent_framework?: string;
}

export default function AssistantPage() {
  const { analysis, setSelectedEvidenceId } = useApp();
  const [mode, setMode] = useState<"vercel-agent" | "grounded-chat">("vercel-agent");
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am **AirGuard Autonomous AI Agent**, built with the **Vercel AI SDK**. I operate in continuous tool-calling mode to query real-time ward telemetry, audit data quality, verify cryptographic evidence IDs, and formulate municipal intervention directives.",
      agent_framework: "Vercel AI SDK Tool-Loop Agent",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Identify all high-priority pollution hotspots and peak wards.",
    "What immediate emergency actions should school administrators take?",
    "Inspect telemetry metrics and trends for Ward 4 (Industrial Zone).",
    "Formulate an action plan for housing societies to mitigate ground dust.",
    "Verify cryptographic evidence ID EVID-WARD4-AVG.",
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

    const userMsg: ExtendedChatMessage = { role: "user", content: q.trim() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    try {
      if (mode === "vercel-agent") {
        // Query the Vercel AI SDK route handler
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: q.trim(), history: updatedHistory }),
        });

        if (!res.ok) {
          throw new Error("Vercel AI Agent endpoint returned an error");
        }

        const data = await res.json();
        setMessages([
          ...updatedHistory,
          {
            role: "assistant",
            content: data.content,
            evidence_ids: data.referenced_evidence_ids,
            executed_tools: data.executed_tools,
            agent_framework: data.agent_framework,
          },
        ]);
      } else {
        // Query the Python FastAPI backend
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
      }
    } catch (err) {
      setMessages([
        ...updatedHistory,
        {
          role: "assistant",
          content:
            "⚠️ Unable to query AI assistant. Ensure the backend engine or Vercel route is reachable.",
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
              <span>AirGuard AI Agent</span>
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Built with Vercel AI SDK & Gemini — autonomous tool-calling civic intelligence
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("vercel-agent")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                mode === "vercel-agent"
                  ? "bg-primary/20 text-primary border border-primary/40 shadow-sm shadow-primary/20"
                  : "bg-surface text-muted hover:text-foreground border border-surfaceBorder"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Vercel AI SDK Agent</span>
            </button>
            <button
              onClick={() => setMode("grounded-chat")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                mode === "grounded-chat"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20"
                  : "bg-surface text-muted hover:text-foreground border border-surfaceBorder"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct Audit Mode</span>
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-sm ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-surface border border-surfaceBorder text-foreground rounded-tl-none"
                }`}
              >
                {/* Agent Tool Executions telemetry */}
                {m.executed_tools && m.executed_tools.length > 0 && (
                  <div className="mb-2.5 pb-2 border-b border-surfaceBorder/80 space-y-1.5">
                    <div className="text-[10px] font-semibold tracking-wider text-muted uppercase flex items-center gap-1.5">
                      <Wrench className="w-3 h-3 text-primary" />
                      <span>Vercel AI SDK Tool Invocations ({m.executed_tools.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.executed_tools.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          {tool.tool}({JSON.stringify(tool.parameters)})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                  {m.content}
                </div>

                {/* Evidence Citations */}
                {m.evidence_ids && m.evidence_ids.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-surfaceBorder/60 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Audited Evidence:
                    </span>
                    {m.evidence_ids.map((id) => (
                      <button
                        key={id}
                        onClick={() => setSelectedEvidenceId(id)}
                        className="px-2 py-0.5 rounded bg-surfaceHover border border-surfaceBorder text-[11px] text-primary hover:text-primaryHover hover:border-primary/40 font-mono transition-colors flex items-center gap-1"
                        title="Click to view full mathematical derivation and sensor row"
                      >
                        <span>{id}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-surface border border-surfaceBorder flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-muted" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-sm justify-start">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-surface border border-surfaceBorder text-muted rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>
                  {mode === "vercel-agent"
                    ? "Vercel AI SDK Agent evaluating tool loop & telemetry..."
                    : "Querying grounded civic dataset..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <HelpCircle className="w-3.5 h-3.5 text-muted shrink-0 ml-1" />
          <span className="text-[11px] text-muted shrink-0 mr-1">Quick prompts:</span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-surface hover:bg-surfaceHover border border-surfaceBorder text-xs text-muted hover:text-foreground whitespace-nowrap transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="pt-2 border-t border-surfaceBorder">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "vercel-agent"
                  ? "Ask the Vercel AI Agent (e.g., 'What actions should schools take in Ward 4?')"
                  : "Ask grounded questions about air quality readings, trends, or evidence..."
              }
              className="flex-1 bg-surface border border-surfaceBorder rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-xl bg-primary hover:bg-primaryHover text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-muted mt-2 px-1">
            <span>
              Framework: <strong className="text-foreground">Vercel AI SDK Core</strong> • Model:{" "}
              <strong className="text-foreground">Gemini 2.5 Flash</strong> • Zero Hallucination Guardrails
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              100% Deterministic Evidence Traceable
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

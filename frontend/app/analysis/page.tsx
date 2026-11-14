"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/components/RoleContext";
import {
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  Flame,
  TrendingUp,
  Award,
  AlertCircle,
  ExternalLink,
  Calculator,
  FileText,
  Info,
} from "lucide-react";

export default function AIAnalysisPage() {
  const { analysis, setSelectedEvidenceId } = useApp();
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("ALL");

  const insights = analysis?.ai_insights || [];
  const limitations = analysis?.data_limitations || [];
  const evidenceRegistry = analysis?.evidence_registry || {};

  const filteredInsights = activeCategoryFilter === "ALL"
    ? insights
    : insights.filter((i) => i.category === activeCategoryFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surfaceBorder">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <BrainCircuit className="w-6 h-6 text-primary" />
              <span>Evidence-Grounded AI Analysis</span>
            </h1>
            <p className="text-xs text-muted mt-1">
              Deterministic environmental findings synthesized with Google Gemini. No hallucinations, full mathematical traceability.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-surfaceCard border border-surfaceBorder text-muted">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Active Engine: {analysis?.ai_engine || "AirGuard Deterministic Intelligence"}</span>
          </div>
        </div>

        {/* Explainability Callout Banner */}
        <div className="p-4 rounded-2xl bg-surfaceCard border border-surfaceBorder flex items-start gap-3">
          <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-foreground">Explainable AI & Mathematical Grounding Protocol</span>
            <p className="text-muted leading-relaxed">
              Every quantitative finding below links directly to an immutable <strong className="text-foreground">Evidence ID</strong>.
              Clicking any evidence tag displays the exact source filename, raw CSV row number, baseline reading, and mathematical percentage calculation.
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: "All AI Findings" },
            { id: "priority_hotspot", label: "Priority Hotspots", icon: Flame },
            { id: "trend_escalation", label: "Trend Trajectories", icon: TrendingUp },
            { id: "improving_area", label: "Clean Baselines", icon: Award },
            { id: "data_limitation", label: "Data Limitations", icon: AlertCircle },
          ].map((tab) => {
            const active = activeCategoryFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategoryFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-background font-semibold shadow-glow"
                    : "bg-surfaceCard border border-surfaceBorder text-muted hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInsights.map((insight) => {
            const isHotspot = insight.category === "priority_hotspot";
            const isTrend = insight.category === "trend_escalation";
            const isLimitation = insight.category === "data_limitation";

            return (
              <div
                key={insight.finding_id}
                className={`p-6 rounded-2xl bg-surfaceCard border transition-all flex flex-col justify-between ${
                  isHotspot
                    ? "border-danger/40 shadow-[0_0_20px_-5px_rgba(239,68,68,0.15)]"
                    : isTrend
                    ? "border-warning/40"
                    : "border-surfaceBorder"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface border border-surfaceBorder text-muted">
                      {insight.finding_id} &bull; {insight.category.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {insight.confidence_score * 100}% Confidence
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {insight.title}
                  </h3>

                  <p className="text-xs text-muted leading-relaxed">
                    {insight.explanation}
                  </p>

                  {/* Fact vs Hypothesis Badge */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      insight.is_hypothesis
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {insight.is_hypothesis ? "Analytical Hypothesis" : "Deterministic Verified Fact"}
                    </span>
                  </div>
                </div>

                {/* Evidence Links */}
                {insight.evidence_ids.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-surfaceBorder/60 space-y-2">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                      Audit Traceability
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {insight.evidence_ids.map((eid) => (
                        <button
                          key={eid}
                          onClick={() => setSelectedEvidenceId(eid)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-surfaceBorder hover:border-secondary text-secondary text-xs font-mono transition-colors"
                        >
                          <span>{eid}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Data Limitations Section */}
        {limitations.length > 0 && (
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              <span>Statistical & Telemetry Limitations</span>
            </h3>
            <p className="text-xs text-muted mb-3">
              In accordance with AirGuard AI strict reliability rules, missing readings and sensor fluctuations are transparently acknowledged:
            </p>
            <ul className="space-y-1.5 text-xs text-muted">
              {limitations.map((lim, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

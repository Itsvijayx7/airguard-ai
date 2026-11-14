"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/components/RoleContext";
import { api, HistoricalComparisonResponse, WardDelta } from "@/services/api";
import {
  History,
  TrendingUp,
  TrendingDown,
  Flame,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function HistoricalComparisonPage() {
  const { analysis, setSelectedEvidenceId } = useApp();
  const [comparison, setComparison] = useState<HistoricalComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const res = await api.getHistoricalComparison(analysis?.analysis_id || "latest");
      setComparison(res);
    } catch (err) {
      console.error("Failed to load historical comparison:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [analysis?.analysis_id]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-surfaceBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <History className="w-6 h-6 text-primary" />
              <span>Historical Briefing Comparison</span>
            </h1>
            <p className="text-xs text-muted mt-1">
              Compare current validated cycle against preceding 72-hour baseline. Identify escalating and improving sectors.
            </p>
          </div>

          <button
            onClick={loadComparison}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surfaceCard border border-surfaceBorder text-xs text-foreground hover:border-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Re-compute Delta</span>
          </button>
        </div>

        {/* AI Comparative Summary Banner */}
        {comparison && (
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="w-4 h-4" />
              <span>Analytical Period Overview</span>
            </div>
            <p className="text-xs text-foreground font-medium leading-relaxed">
              {comparison.ai_comparative_summary}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-muted border-t border-surfaceBorder/60">
              <span>Current Period: <strong className="text-foreground">{comparison.current_period}</strong></span>
              <span>Baseline: <strong className="text-foreground">{comparison.baseline_period}</strong></span>
              <span>Completeness Delta: <strong className="text-emerald-400">+{comparison.completeness_delta}%</strong></span>
            </div>
          </div>
        )}

        {/* 4 Status Quadrants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Worsening Locations */}
          <div className="p-5 rounded-2xl bg-surfaceCard border border-danger/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-danger font-semibold text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>Worsening Locations ({comparison?.worsening_locations.length || 0})</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-danger bg-danger/10 px-2 py-0.5 rounded">
                Escalating
              </span>
            </div>
            <p className="text-xs text-muted">
              Wards with statistically verified particulate concentration increases compared to previous window.
            </p>

            <div className="space-y-2 pt-2">
              {comparison?.worsening_locations.map((w) => (
                <div
                  key={w.ward}
                  className="p-3 rounded-xl bg-surface border border-surfaceBorder/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-foreground">{w.ward}</span>
                    <span className="text-muted block text-[11px]">
                      {w.previous_pm25} µg/m³ &rarr; <strong className="text-danger">{w.current_pm25} µg/m³</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-danger font-bold text-xs">+{w.percentage_change}%</span>
                    <button
                      onClick={() => setSelectedEvidenceId(w.evidence_id)}
                      className="block text-[10px] text-primary hover:underline font-mono"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              ))}
              {(!comparison?.worsening_locations || comparison.worsening_locations.length === 0) && (
                <div className="text-xs text-muted py-4 text-center">No worsening sectors identified.</div>
              )}
            </div>
          </div>

          {/* 2. Improving Locations */}
          <div className="p-5 rounded-2xl bg-surfaceCard border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <TrendingDown className="w-4 h-4" />
                <span>Improving Locations ({comparison?.improving_locations.length || 0})</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Positive Trend
              </span>
            </div>
            <p className="text-xs text-muted">
              Sectors exhibiting verifiable reductions in ambient particulate loading.
            </p>

            <div className="space-y-2 pt-2">
              {comparison?.improving_locations.map((w) => (
                <div
                  key={w.ward}
                  className="p-3 rounded-xl bg-surface border border-surfaceBorder/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-foreground">{w.ward}</span>
                    <span className="text-muted block text-[11px]">
                      {w.previous_pm25} µg/m³ &rarr; <strong className="text-emerald-400">{w.current_pm25} µg/m³</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold text-xs">{w.percentage_change}%</span>
                    <button
                      onClick={() => setSelectedEvidenceId(w.evidence_id)}
                      className="block text-[10px] text-primary hover:underline font-mono"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              ))}
              {(!comparison?.improving_locations || comparison.improving_locations.length === 0) && (
                <div className="text-xs text-muted py-4 text-center">No improving locations recorded.</div>
              )}
            </div>
          </div>

          {/* 3. Persistent Hotspots */}
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                <Flame className="w-4 h-4 text-warning" />
                <span>Persistent Hotspots ({comparison?.persistent_hotspots.length || 0})</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-warning bg-warning/10 px-2 py-0.5 rounded">
                Static Elevated
              </span>
            </div>
            <p className="text-xs text-muted">
              Locations that remain severely above safe thresholds across consecutive measurement cycles.
            </p>

            <div className="space-y-2 pt-2">
              {comparison?.persistent_hotspots.map((w) => (
                <div
                  key={w.ward}
                  className="p-3 rounded-xl bg-surface border border-surfaceBorder/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-foreground">{w.ward}</span>
                    <span className="text-muted block text-[11px]">Sustained: {w.current_pm25} µg/m³</span>
                  </div>
                  <button
                    onClick={() => setSelectedEvidenceId(w.evidence_id)}
                    className="text-[10px] text-primary hover:underline font-mono"
                  >
                    Inspect
                  </button>
                </div>
              ))}
              {(!comparison?.persistent_hotspots || comparison.persistent_hotspots.length === 0) && (
                <div className="text-xs text-muted py-4 text-center">No static hotspots detected.</div>
              )}
            </div>
          </div>

          {/* 4. Unresolved Data Problems */}
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted font-semibold text-sm">
                <ShieldAlert className="w-4 h-4 text-muted" />
                <span>Unresolved Data Limitations</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-muted bg-surface px-2 py-0.5 rounded">
                Audit Notice
              </span>
            </div>
            <p className="text-xs text-muted">
              Sensor outages or anomalous transmissions requiring physical hardware inspection.
            </p>

            <div className="space-y-2 pt-2">
              {comparison?.unresolved_data_problems.map((prob, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface border border-surfaceBorder/80 text-xs text-muted flex items-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                  <span>{prob}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

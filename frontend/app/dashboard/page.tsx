"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/components/RoleContext";
import { formatNumber, getCategoryColor } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Activity,
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  Flame,
  HelpCircle,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wind,
} from "lucide-react";

export default function DashboardPage() {
  const { analysis, loading, setSelectedEvidenceId, role, loadDemoData } = useApp();
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>("ALL");
  const [selectedPollutant, setSelectedPollutant] = useState<"PM25" | "PM10">("PM25");

  const overall = analysis?.overall_stats;
  const wards = analysis?.ward_rankings || [];
  const trends = analysis?.historical_trends || [];
  const insights = analysis?.ai_insights || [];

  // Filtered wards
  const filteredWards = useMemo(() => {
    if (selectedWardFilter === "ALL") return wards;
    return wards.filter((w) => w.ward === selectedWardFilter);
  }, [wards, selectedWardFilter]);

  // Chart data for trends
  const chartData = useMemo(() => {
    return trends.map((t) => ({
      date: t.date.split(" ")[0].slice(5),
      fullDate: t.date,
      PM25: t.avg_pm25,
      PM10: t.avg_pm10,
    }));
  }, [trends]);

  if (loading && !analysis) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted">Auditing environmental telemetry...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surfaceBorder">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Pollution Intelligence Dashboard</span>
              {analysis?.is_demo_mode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary">
                  DEMO DATASET
                </span>
              )}
            </h1>
            <p className="text-xs text-muted mt-1">
              Deterministic particulate measurements across monitored municipal sectors
            </p>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Ward selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surfaceCard border border-surfaceBorder text-xs">
              <Filter className="w-3.5 h-3.5 text-muted" />
              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="bg-transparent text-foreground outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-surfaceCard">All Wards ({wards.length})</option>
                {wards.map((w) => (
                  <option key={w.ward} value={w.ward} className="bg-surfaceCard">
                    {w.ward}
                  </option>
                ))}
              </select>
            </div>

            {/* Pollutant Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-surfaceCard border border-surfaceBorder text-xs">
              <button
                onClick={() => setSelectedPollutant("PM25")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  selectedPollutant === "PM25"
                    ? "bg-primary text-background font-semibold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                PM2.5
              </button>
              <button
                onClick={() => setSelectedPollutant("PM10")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  selectedPollutant === "PM10"
                    ? "bg-primary text-background font-semibold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                PM10
              </button>
            </div>
          </div>
        </div>

        {/* 6 Key Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Avg PM2.5 */}
          <div className="p-4 rounded-2xl bg-surfaceCard border border-surfaceBorder">
            <div className="flex items-center justify-between text-muted text-xs mb-1">
              <span>Avg PM2.5</span>
              <Wind className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(overall?.avg_pm25)} <span className="text-xs font-normal text-muted">µg/m³</span>
            </div>
            <div className="text-[11px] text-muted mt-1">Regional baseline</div>
          </div>

          {/* 2. Avg PM10 */}
          <div className="p-4 rounded-2xl bg-surfaceCard border border-surfaceBorder">
            <div className="flex items-center justify-between text-muted text-xs mb-1">
              <span>Avg PM10</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(overall?.avg_pm10)} <span className="text-xs font-normal text-muted">µg/m³</span>
            </div>
            <div className="text-[11px] text-muted mt-1">Coarse dust loading</div>
          </div>

          {/* 3. Monitored Wards */}
          <div className="p-4 rounded-2xl bg-surfaceCard border border-surfaceBorder">
            <div className="flex items-center justify-between text-muted text-xs mb-1">
              <span>Monitored Wards</span>
              <Building className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {overall?.total_wards || 0}
            </div>
            <div className="text-[11px] text-muted mt-1">{overall?.monitored_stations || 0} stations active</div>
          </div>

          {/* 4. Data Completeness */}
          <div className="p-4 rounded-2xl bg-surfaceCard border border-surfaceBorder">
            <div className="flex items-center justify-between text-muted text-xs mb-1">
              <span>Completeness</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {overall?.data_completeness}%
            </div>
            <div className="text-[11px] text-muted mt-1">Verified records</div>
          </div>

          {/* 5. High Priority Locations */}
          <div className="p-4 rounded-2xl bg-surfaceCard border border-surfaceBorder">
            <div className="flex items-center justify-between text-muted text-xs mb-1">
              <span>Priority Wards</span>
              <Flame className="w-4 h-4 text-danger" />
            </div>
            <div className="text-2xl font-bold text-danger">
              {overall?.high_priority_locations || 0}
            </div>
            <div className="text-[11px] text-muted mt-1">Exceeding safe norms</div>
          </div>

          {/* 6. Peak Reading */}
          <div className="p-4 rounded-2xl bg-surfaceCard border border-surfaceBorder">
            <div className="flex items-center justify-between text-muted text-xs mb-1">
              <span>Peak Recorded</span>
              <AlertCircle className="w-4 h-4 text-warning" />
            </div>
            <div className="text-2xl font-bold text-warning">
              {formatNumber(overall?.max_pm25)} <span className="text-xs font-normal text-muted">µg/m³</span>
            </div>
            <div className="text-[11px] text-muted mt-1">Max observed spike</div>
          </div>
        </div>

        {/* Visualizations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Time-Series Trend (2 Columns) */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Historical Pollution Trend</h3>
                <p className="text-xs text-muted">Telemetry progression across monitored sequence</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full" /> PM2.5
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" /> PM10
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" µg" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#1E293B", borderRadius: "0.75rem", fontSize: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="PM25"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ fill: "#10B981", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="PM10"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: "#06B6D4", r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ward Comparison Bar Chart */}
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Ward Pollution Rankings</h3>
                <p className="text-xs text-muted">{selectedPollutant} Concentration</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredWards} layout="vertical" margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="ward" stroke="#94A3B8" fontSize={11} tickLine={false} width={65} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#1E293B", borderRadius: "0.75rem", fontSize: "12px" }}
                  />
                  <Bar
                    dataKey={selectedPollutant === "PM25" ? "avg_pm25" : "avg_pm10"}
                    radius={[0, 4, 4, 0]}
                  >
                    {filteredWards.map((entry, index) => {
                      const color = entry.category === "Severe" || entry.category === "Very Poor"
                        ? "#EF4444"
                        : entry.category === "Poor"
                        ? "#F59E0B"
                        : "#10B981";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI-Generated Evidence-Backed Findings */}
        <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder">
          <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Evidence-Grounded AI Insights</h3>
                <p className="text-xs text-muted">Engine: {analysis?.ai_engine}</p>
              </div>
            </div>
            <span className="text-xs text-muted font-mono">100% Traceable</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((f) => (
              <div
                key={f.finding_id}
                className="p-4 rounded-xl bg-surface border border-surfaceBorder/70 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">{f.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surfaceCard text-muted border border-surfaceBorder">
                      {f.confidence_score * 100}% Confidence
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{f.explanation}</p>
                </div>

                {f.evidence_ids.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-surfaceBorder/40 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-muted">Supporting Evidence:</span>
                    {f.evidence_ids.map((eid) => (
                      <button
                        key={eid}
                        onClick={() => setSelectedEvidenceId(eid)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary/10 border border-secondary/30 text-secondary text-[11px] font-mono hover:bg-secondary/20 transition-colors"
                      >
                        <span>{eid}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Ward Monitored Table */}
        <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder">
          <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Monitored Ward Registry</h3>
              <p className="text-xs text-muted">Click any evidence link to inspect mathematical calculation</p>
            </div>
            <span className="text-xs text-muted">{filteredWards.length} Wards Listed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surfaceBorder text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Monitoring Station</th>
                  <th className="py-2.5 px-3">Avg PM2.5</th>
                  <th className="py-2.5 px-3">Avg PM10</th>
                  <th className="py-2.5 px-3">Air Category</th>
                  <th className="py-2.5 px-3">Trend Direction</th>
                  <th className="py-2.5 px-3">Completeness</th>
                  <th className="py-2.5 px-3 text-right">Audit Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/50">
                {filteredWards.map((w) => {
                  const catStyle = getCategoryColor(w.category);
                  const isIncreasing = w.trend_direction === "INCREASING";
                  return (
                    <tr key={w.ward} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-foreground">{w.ward}</td>
                      <td className="py-3 px-3 text-muted">{w.station}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">
                        {w.avg_pm25} <span className="text-[10px] text-muted font-normal">µg/m³</span>
                      </td>
                      <td className="py-3 px-3 text-muted">
                        {w.avg_pm10} <span className="text-[10px]">µg/m³</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                          {w.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 font-medium ${isIncreasing ? "text-danger" : "text-emerald-400"}`}>
                          {isIncreasing ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{w.trend_percentage > 0 ? `+${w.trend_percentage}%` : `${w.trend_percentage}%`}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted">{w.data_completeness}%</td>
                      <td className="py-3 px-3 text-right">
                        {w.evidence_ids.length > 0 ? (
                          <button
                            onClick={() => setSelectedEvidenceId(w.evidence_ids[0])}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface border border-surfaceBorder hover:border-primary/40 text-primary font-mono text-[10px] transition-colors"
                          >
                            <span>{w.evidence_ids[0]}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        ) : (
                          <span className="text-muted text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

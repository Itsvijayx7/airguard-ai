"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp, UserRole } from "@/components/RoleContext";
import { api, ActionRecommendation } from "@/services/api";
import {
  ClipboardList,
  Shield,
  Building2,
  GraduationCap,
  Flame,
  Clock,
  Users,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from "lucide-react";

export default function ActionPlannerPage() {
  const { role, setRole, analysis, setSelectedEvidenceId } = useApp();
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  const loadRoleActions = async (targetRole: UserRole) => {
    try {
      setLoading(true);
      const res = await api.getRoleActions(analysis?.analysis_id || "latest", targetRole);
      setRecommendations(res.recommendations);
    } catch (err) {
      console.error("Failed to load role recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoleActions(role);
  }, [role, analysis?.analysis_id]);

  const filteredRecs = filterPriority === "ALL"
    ? recommendations
    : recommendations.filter((r) => r.priority === filterPriority);

  const roleMeta: Record<UserRole, { title: string; desc: string; icon: any; color: string }> = {
    municipal_officer: {
      title: "Municipal Officer & City Engineering",
      desc: "Mandated directives for dust mitigation, anti-smog deployment, and industrial inspections",
      icon: Shield,
      color: "text-emerald-400",
    },
    housing_society: {
      title: "Housing Society Administrator",
      desc: "Residential guidelines for HVAC filtration, dust suppression, and resident wellness",
      icon: Building2,
      color: "text-cyan-400",
    },
    school_administrator: {
      title: "School Administrator & Child Care",
      desc: "Protective protocols for pediatric exposure, transit buses, and outdoor sports suspension",
      icon: GraduationCap,
      color: "text-amber-400",
    },
  };

  const CurrentIcon = roleMeta[role].icon;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surfaceBorder">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <ClipboardList className="w-6 h-6 text-primary" />
              <span>Role-Based Environmental Action Planner</span>
            </h1>
            <p className="text-xs text-muted mt-1">
              Deterministic priority scoring grounded in local particulate telemetry
            </p>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surfaceCard border border-surfaceBorder text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="ALL">All Priorities ({recommendations.length})</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium / Routine</option>
            </select>
          </div>
        </div>

        {/* 3 Role Persona Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["municipal_officer", "housing_society", "school_administrator"] as UserRole[]).map((r) => {
            const active = role === r;
            const meta = roleMeta[r];
            const Icon = meta.icon;
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`p-5 rounded-2xl text-left border transition-all ${
                  active
                    ? "bg-surfaceCard border-primary shadow-glow"
                    : "bg-surfaceCard/60 border-surfaceBorder hover:border-surfaceBorder hover:bg-surfaceCard"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-surface border border-surfaceBorder ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {active && (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                      Active
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{meta.title}</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">{meta.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Action Recommendations Stream */}
        {loading ? (
          <div className="p-12 text-center text-xs text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Calculating priority directives for {roleMeta[role].title}...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecs.map((rec) => {
              const isCritical = rec.priority === "CRITICAL";
              const isHigh = rec.priority === "HIGH";

              return (
                <div
                  key={rec.id}
                  className={`p-6 rounded-2xl bg-surfaceCard border space-y-4 transition-all ${
                    isCritical
                      ? "border-danger/40 shadow-[0_0_20px_-5px_rgba(239,68,68,0.15)]"
                      : isHigh
                      ? "border-warning/40"
                      : "border-surfaceBorder"
                  }`}
                >
                  {/* Top Bar: Title, Priority score badge, Target wards */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surfaceBorder/60">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isCritical
                            ? "bg-danger/10 text-danger border-danger/30"
                            : isHigh
                            ? "bg-warning/10 text-warning border-warning/30"
                            : "bg-surface text-muted border-surfaceBorder"
                        }`}>
                          {rec.priority} PRIORITY
                        </span>
                        <span className="text-xs text-muted font-mono">
                          Score: <strong className="text-foreground">{rec.priority_score}/100</strong>
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        {rec.action_title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                      <Clock className="w-3.5 h-3.5 text-secondary" />
                      <span>{rec.suggested_timeframe}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {rec.description}
                  </p>

                  {/* Specific Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-surface border border-surfaceBorder/60">
                      <span className="text-muted text-[10px] block uppercase font-semibold">Scientific Reason</span>
                      <p className="text-foreground mt-0.5 font-medium">{rec.reason}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-surface border border-surfaceBorder/60">
                      <span className="text-muted text-[10px] block uppercase font-semibold">Target Audience / Unit</span>
                      <p className="text-foreground mt-0.5 font-medium">{rec.intended_audience}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-surface border border-surfaceBorder/60">
                      <span className="text-muted text-[10px] block uppercase font-semibold">Target Wards</span>
                      <p className="text-foreground mt-0.5 font-medium">{rec.target_wards.join(", ")}</p>
                    </div>
                  </div>

                  {/* Limitations & Evidence ID */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-surfaceBorder/40 text-xs">
                    <div className="text-muted text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                      <span>{rec.data_limitations}</span>
                    </div>

                    {rec.evidence_ids.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[11px] text-muted">Audited Evidence:</span>
                        {rec.evidence_ids.map((eid) => (
                          <button
                            key={eid}
                            onClick={() => setSelectedEvidenceId(eid)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary/10 border border-secondary/30 text-secondary font-mono text-[11px] hover:bg-secondary/20 transition-colors"
                          >
                            <span>{eid}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

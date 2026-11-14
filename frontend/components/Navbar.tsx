"use client";

import React, { useState } from "react";
import { useApp, UserRole } from "./RoleContext";
import {
  Bell,
  Sparkles,
  Shield,
  Building2,
  GraduationCap,
  ChevronDown,
  RefreshCw,
  Search,
  CheckCircle2,
  Menu,
} from "lucide-react";

interface NavbarProps {
  onMobileToggle?: () => void;
}

export function Navbar({ onMobileToggle }: NavbarProps) {
  const { role, setRole, analysis, loading, loadDemoData } = useApp();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; icon: any; color: string }> = {
    municipal_officer: { label: "Municipal Officer", icon: Shield, color: "text-emerald-400" },
    housing_society: { label: "Housing Society Admin", icon: Building2, color: "text-cyan-400" },
    school_administrator: { label: "School Administrator", icon: GraduationCap, color: "text-amber-400" },
  };

  const CurrentRoleIcon = roleLabels[role].icon;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-surfaceBorder bg-surface/90 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Mobile trigger & Active context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="md:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-surfaceCard"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-muted">
            Civic Grid:
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surfaceCard border border-surfaceBorder text-xs text-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[150px] sm:max-w-none">
              {analysis?.overall_stats
                ? `${analysis.overall_stats.total_wards} Wards Monitored (${analysis.overall_stats.data_completeness}% verified)`
                : "Initializing Engine..."}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick Demo, Role Switcher, Alerts, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* One-Click Demo Load Button */}
        <button
          onClick={loadDemoData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surfaceCard hover:bg-surfaceCard/80 border border-surfaceBorder text-xs font-medium text-foreground transition-all hover:border-primary/40 disabled:opacity-50"
          title="Reload realistic synthetic dataset with deliberate missing values and spikes"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Reload Demo</span>
        </button>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surfaceCard border border-surfaceBorder text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
          >
            <CurrentRoleIcon className={`w-3.5 h-3.5 ${roleLabels[role].color}`} />
            <span className="hidden md:inline">{roleLabels[role].label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surfaceCard border border-surfaceBorder shadow-2xl p-1.5 z-50">
              <div className="px-3 py-2 text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-surfaceBorder">
                Switch Operational Persona
              </div>
              {(["municipal_officer", "housing_society", "school_administrator"] as UserRole[]).map((r) => {
                const ItemIcon = roleLabels[r].icon;
                const active = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-foreground hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ItemIcon className={`w-4 h-4 ${roleLabels[r].color}`} />
                      <span>{roleLabels[r].label}</span>
                    </div>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-surfaceCard transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warning animate-pulse" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-surfaceCard border border-surfaceBorder shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-surfaceBorder">
                <span className="text-xs font-semibold text-foreground">Operational Notifications</span>
                <span className="text-[10px] text-muted">2 New</span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="p-2.5 rounded-lg bg-surface border border-surfaceBorder/60 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-warning mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    <span>Suspicious Value Isolated</span>
                  </div>
                  <p className="text-muted text-[11px]">
                    Row #29 reported extreme spike of 1240.0 µg/m³; segregated into Data Quality Center.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-surface border border-surfaceBorder/60 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-emerald-400 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Audit Pipeline Complete</span>
                  </div>
                  <p className="text-muted text-[11px]">
                    8 wards analyzed. Deterministic evidence IDs linked.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-surfaceBorder">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-[11px] font-bold text-background shadow-glow">
            AG
          </div>
        </div>
      </div>
    </header>
  );
}

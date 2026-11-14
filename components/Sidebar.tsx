"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  BrainCircuit,
  MapPin,
  Bot,
  ClipboardList,
  FileSpreadsheet,
  History,
  ShieldAlert,
  Settings,
  Wind,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { name: "Overview Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Data Upload Center", href: "/upload", icon: UploadCloud },
  { name: "AI Analysis", href: "/analysis", icon: BrainCircuit },
  { name: "Hotspot Map", href: "/map", icon: MapPin },
  { name: "Ask AirGuard AI", href: "/assistant", icon: Bot },
  { name: "Action Planner", href: "/planner", icon: ClipboardList },
  { name: "Briefing Studio", href: "/briefing", icon: FileSpreadsheet },
  { name: "Historical Comparison", href: "/comparison", icon: History },
  { name: "Data Quality Center", href: "/quality", icon: ShieldAlert },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-surfaceBorder bg-surface transition-transform duration-300 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-surfaceBorder">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary group-hover:scale-105 transition-transform shadow-glow">
              <Wind className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-foreground text-base block">
                AIRGUARD <span className="text-primary font-mono text-xs">AI</span>
              </span>
              <span className="text-[10px] text-muted tracking-wider block uppercase">Civic Intelligence</span>
            </div>
          </Link>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-glow font-semibold"
                    : "text-muted hover:text-foreground hover:bg-surfaceCard"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-primary" : "text-muted group-hover:text-foreground"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Engine Status Card */}
        <div className="p-4 border-t border-surfaceBorder">
          <div className="p-3 rounded-xl bg-surfaceCard border border-surfaceBorder/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-muted uppercase">Intelligence Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-xs text-foreground font-medium">Gemini 2.5 / Rule Engine</div>
            <p className="text-[10px] text-muted mt-0.5">Deterministic Audit Active</p>
          </div>
        </div>
      </aside>
    </>
  );
}

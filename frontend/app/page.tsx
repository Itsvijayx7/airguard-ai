"use client";

import React from "react";
import Link from "next/link";
import {
  Wind,
  Shield,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Database,
  BarChart3,
  FileCheck2,
  CheckCircle2,
  MapPin,
  Bot,
  AlertTriangle,
  FileDown,
  Layers,
} from "lucide-react";
import { useApp } from "@/components/RoleContext";

export default function LandingPage() {
  const { loadDemoData, loading } = useApp();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-surfaceBorder bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary shadow-glow">
            <Wind className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-foreground text-lg">
              AIRGUARD <span className="text-primary font-mono text-sm">AI</span>
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDemoData}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-surfaceBorder hover:border-primary/40 text-muted hover:text-foreground transition-colors"
          >
            Load Sample Dataset
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-background text-xs font-semibold shadow-glow transition-all"
          >
            Launch Platform
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 md:px-12 text-center max-w-5xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surfaceCard border border-surfaceBorder mb-6">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-medium text-foreground">
            Next-Generation AI Civic Environmental Intelligence
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
          Turn Air Quality Data Into <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary via-secondary to-primary-light bg-clip-text text-transparent">
            Community Action.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted max-w-3xl leading-relaxed">
          Transform complex environmental measurements into intelligent local decisions with AI-powered civic intelligence.
          Bridge messy urban sensor telemetry with auditable, evidence-backed interventions.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-background font-semibold text-sm shadow-glow transition-all hover:scale-[1.02]"
          >
            <span>Explore Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surfaceCard hover:bg-surfaceCard/80 border border-surfaceBorder text-foreground font-semibold text-sm transition-all hover:border-secondary/40"
          >
            <span>Start Analyzing</span>
          </Link>
        </div>

        {/* Hero Visual Metric Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder text-left">
            <span className="text-xs font-medium text-muted uppercase">Audited Completeness</span>
            <div className="mt-1 text-2xl font-bold text-foreground">94.2% Verified</div>
            <p className="mt-1 text-xs text-muted">Zero silent fabrication of missing particulate values</p>
          </div>
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder text-left">
            <span className="text-xs font-medium text-muted uppercase">Traceable Evidence</span>
            <div className="mt-1 text-2xl font-bold text-secondary">100% Grounded</div>
            <p className="mt-1 text-xs text-muted">Every AI conclusion links to raw file row & calculation</p>
          </div>
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder text-left">
            <span className="text-xs font-medium text-muted uppercase">Role Interventions</span>
            <div className="mt-1 text-2xl font-bold text-primary">3 Tailored Roles</div>
            <p className="mt-1 text-xs text-muted">Municipal officers, housing societies, & schools</p>
          </div>
        </div>
      </section>

      {/* 3. Product Introduction & Core Capabilities */}
      <section className="py-20 px-6 md:px-12 bg-surface/50 border-y border-surfaceBorder">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Built for Real-World Environmental Realities
            </h2>
            <p className="mt-3 text-sm text-muted">
              Municipal data is fragmented, sensors drift, and citizens need clarity. AirGuard AI provides deterministic auditability backed by state-of-the-art Generative AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-surfaceCard border border-surfaceBorder hover:border-primary/40 transition-all">
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Messy Data Engine</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Accepts CSV, Excel, and JSON. Auto-detects inconsistent headers (PM25, Ward, Station), parses dates, and normalizes units.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surfaceCard border border-surfaceBorder hover:border-secondary/40 transition-all">
              <div className="p-3 rounded-xl bg-secondary/10 text-secondary w-fit mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Data Quality Score</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Flags duplicate records, negative values, and sensor spikes into an audit registry without silently altering original rows.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surfaceCard border border-surfaceBorder hover:border-warning/40 transition-all">
              <div className="p-3 rounded-xl bg-warning/10 text-warning w-fit mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Gemini AI Synthesis</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Generates contextual environmental insights and citizen alerts using strict structured JSON schemas with full fallback protection.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surfaceCard border border-surfaceBorder hover:border-primary/40 transition-all">
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Evidence Traceability</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Every numerical finding includes an immutable Evidence ID showing the exact formula, baseline reading, and source row.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How AirGuard AI Works (Workflow) */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Process Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">
            From Messy Telemetry to Community Protection
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Upload & Auto-Map", desc: "Drag and drop raw monitoring files. Auto-detects columns and previews rows." },
            { step: "02", title: "Cleanse & Audit", desc: "Detects missing readings, unit mismatches, and spikes. Preserves audit history." },
            { step: "03", title: "Evidence Grounding", desc: "Computes ward rankings, mathematical changes, and immutable Evidence IDs." },
            { step: "04", title: "Action & Briefings", desc: "Generates tailored role actions, multilingual citizen advisories, and PDFs." },
          ].map((item, idx) => (
            <div key={idx} className="relative p-6 rounded-2xl bg-surfaceCard border border-surfaceBorder">
              <span className="text-2xl font-mono font-bold text-primary/40 block mb-3">{item.step}</span>
              <h4 className="text-sm font-semibold text-foreground mb-1">{item.title}</h4>
              <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Supported User Roles */}
      <section className="py-20 px-6 md:px-12 bg-surface/50 border-t border-surfaceBorder">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Tailored Intelligence for Every Stakeholder
            </h2>
            <p className="mt-3 text-sm text-muted">
              Different community leaders require distinct action frameworks when air quality deteriorates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surfaceCard border border-surfaceBorder">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Municipal Officers</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Direct anti-smog mist sprayers, enforce demolition and industrial dust curbs, initiate inter-ward traffic restrictions, and prepare formal cabinet briefings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surfaceCard border border-surfaceBorder">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Housing Societies</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Halt dry leaf-blowing, transition to wet perimeter cleaning, optimize HVAC recirculation, and broadcast health notices for senior residents.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surfaceCard border border-surfaceBorder">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">School Administrators</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Suspend outdoor physical sports, mandate closed-window bus commutes, verify infirmary pediatric inhalers, and issue parent updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Ready to protect your community with verified air intelligence?
        </h2>
        <p className="mt-4 text-sm text-muted max-w-xl mx-auto">
          Explore the interactive dashboard, upload your municipality dataset, or inspect the pre-loaded Mumbai Civic Grid simulation.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-background font-semibold text-sm shadow-glow transition-all"
          >
            Open Interactive Dashboard
          </Link>
          <Link
            href="/upload"
            className="px-6 py-3.5 rounded-xl bg-surfaceCard border border-surfaceBorder text-foreground font-semibold text-sm hover:border-primary/40 transition-colors"
          >
            Upload Dataset
          </Link>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="mt-auto border-t border-surfaceBorder bg-surface py-8 px-6 text-center text-xs text-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">AIRGUARD AI</span>
            <span>— Understand the Air. Protect Your Community.</span>
          </div>
          <div>Built with Google Antigravity, FastAPI, Supabase, and Next.js</div>
        </div>
      </footer>
    </div>
  );
}

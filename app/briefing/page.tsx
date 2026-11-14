"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/components/RoleContext";
import { api, ReportResponse } from "@/services/api";
import {
  FileSpreadsheet,
  FileDown,
  Globe,
  Sliders,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Printer,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function BriefingStudioPage() {
  const { analysis, setSelectedEvidenceId } = useApp();

  const [reportType, setReportType] = useState<"government_briefing" | "citizen_advisory">("government_briefing");
  const [language, setLanguage] = useState<string>("en");
  const [readingLevel, setReadingLevel] = useState<string>("Standard");
  const [generating, setGenerating] = useState<boolean>(false);
  const [report, setReport] = useState<ReportResponse | null>(null);

  const handleGenerate = async (
    targetType = reportType,
    targetLang = language,
    targetLevel = readingLevel
  ) => {
    try {
      setGenerating(true);
      const res = await api.generateReport(
        analysis?.analysis_id || "latest",
        targetType,
        targetLang,
        targetLevel
      );
      setReport(res);
    } catch (err) {
      console.error("Failed to generate briefing:", err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [analysis?.analysis_id]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surfaceBorder">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              <span>Multilingual Briefing Studio</span>
            </h1>
            <p className="text-xs text-muted mt-1">
              Generate official government directives & citizen health advisories in 5 regional languages
            </p>
          </div>

          {report && (
            <a
              href={api.getPdfUrl(report.report_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-background text-xs font-semibold shadow-glow transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Official PDF (ReportLab)</span>
            </a>
          )}
        </div>

        {/* Configuration Bar */}
        <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* 1. Report Type */}
            <div>
              <label className="text-muted block mb-1.5 font-medium">Document Type</label>
              <div className="flex rounded-xl bg-surface border border-surfaceBorder p-1">
                <button
                  onClick={() => {
                    setReportType("government_briefing");
                    handleGenerate("government_briefing", language, readingLevel);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-colors ${
                    reportType === "government_briefing"
                      ? "bg-primary text-background font-semibold"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Govt Briefing
                </button>
                <button
                  onClick={() => {
                    setReportType("citizen_advisory");
                    handleGenerate("citizen_advisory", language, readingLevel);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-colors ${
                    reportType === "citizen_advisory"
                      ? "bg-primary text-background font-semibold"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Citizen Advisory
                </button>
              </div>
            </div>

            {/* 2. Language */}
            <div>
              <label className="text-muted block mb-1.5 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-secondary" />
                <span>Publication Language</span>
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  handleGenerate(reportType, e.target.value, readingLevel);
                }}
                className="w-full p-2 rounded-xl bg-surface border border-surfaceBorder text-foreground outline-none focus:border-primary"
              >
                <option value="en">English (Official)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
                <option value="ta">Tamil (தமிழ்)</option>
              </select>
            </div>

            {/* 3. Reading Level */}
            <div>
              <label className="text-muted block mb-1.5 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-warning" />
                <span>Reading Complexity Level</span>
              </label>
              <select
                value={readingLevel}
                onChange={(e) => {
                  setReadingLevel(e.target.value);
                  handleGenerate(reportType, language, e.target.value);
                }}
                className="w-full p-2 rounded-xl bg-surface border border-surfaceBorder text-foreground outline-none focus:border-primary"
              >
                <option value="Simple">Simple (Elementary & Citizens)</option>
                <option value="Standard">Standard (General Public)</option>
                <option value="Professional">Professional (Engineers & Admin)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Report Preview Document */}
        {generating ? (
          <div className="p-16 text-center text-xs text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Compiling evidence-grounded report in {language.toUpperCase()}...</span>
          </div>
        ) : report ? (
          <div className="p-8 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-6 shadow-2xl">
            {/* Document Header Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-surfaceBorder">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface border border-surfaceBorder text-muted">
                  ID: {report.report_id} &bull; {report.language_display}
                </span>
                <h2 className="text-xl font-bold text-foreground mt-2">
                  {report.title}
                </h2>
                <p className="text-xs text-muted mt-1">Generated: {report.created_at}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={api.getPdfUrl(report.report_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surfaceBorder hover:border-primary text-xs font-medium text-foreground transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-primary" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>

            {/* Headline / Summary Box */}
            <div className="p-4 rounded-xl bg-surface border border-surfaceBorder">
              <span className="text-[10px] font-semibold uppercase text-muted block mb-1">
                Executive Directive & Observation
              </span>
              <p className="text-xs text-foreground font-medium leading-relaxed">
                {report.executive_summary_or_headline}
              </p>
            </div>

            {/* Affected Locations */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted mb-2 tracking-wider">
                Impacted Municipal Wards
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {report.affected_locations.map((loc) => (
                  <span
                    key={loc}
                    className="px-2.5 py-1 rounded-lg bg-surface border border-surfaceBorder text-xs text-foreground font-medium"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Observations */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted mb-2 tracking-wider">
                Validated Particulate Observations
              </h3>
              <ul className="space-y-1.5 text-xs text-foreground">
                {report.key_findings_or_observations.map((obs, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Precautions / Directives */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted mb-2 tracking-wider">
                Mandated Action Directives
              </h3>
              <ul className="space-y-1.5 text-xs text-foreground">
                {report.priority_actions_or_precautions.map((act, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Full Markdown Preview View */}
            <div className="pt-4 border-t border-surfaceBorder">
              <details className="text-xs text-muted">
                <summary className="cursor-pointer hover:text-foreground font-medium">
                  View Full Markdown Output Text
                </summary>
                <div className="mt-3 p-4 rounded-xl bg-surface font-mono text-[11px] whitespace-pre-wrap leading-relaxed text-foreground/90 border border-surfaceBorder">
                  {report.full_text_markdown}
                </div>
              </details>
            </div>

            {/* Footer Audit Traceability */}
            <div className="pt-4 border-t border-surfaceBorder/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{report.data_limitations}</span>
              </div>

              {report.evidence_citations.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span>Cited Evidence:</span>
                  {report.evidence_citations.map((eid) => (
                    <button
                      key={eid}
                      onClick={() => setSelectedEvidenceId(eid)}
                      className="px-2 py-0.5 rounded bg-surface border border-surfaceBorder text-secondary font-mono text-[10px] hover:border-secondary"
                    >
                      {eid}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

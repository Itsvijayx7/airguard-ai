"use client";

import React from "react";
import { useApp } from "./RoleContext";
import { X, CheckCircle2, FileText, Hash, Calculator, ShieldCheck, Copy, Check } from "lucide-react";
import { useState } from "react";

export function EvidenceModal() {
  const { selectedEvidenceId, setSelectedEvidenceId, analysis } = useApp();
  const [copied, setCopied] = useState(false);

  if (!selectedEvidenceId) return null;

  const evidence = analysis?.evidence_registry?.[selectedEvidenceId];

  const handleCopy = () => {
    if (evidence) {
      navigator.clipboard.writeText(
        `[Evidence ID: ${evidence.evidence_id}] Source: ${evidence.original_filename} (Row ${evidence.original_row_number || "Aggregated"}). Measurement: ${evidence.current_reading} ${evidence.unit}. Formula: ${evidence.calculation}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-surfaceCard border border-surfaceBorder shadow-2xl p-6 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surfaceBorder">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Evidence Verification Audit</h3>
              <p className="text-xs text-muted">Immutable traceability from raw civic readings</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedEvidenceId(null)}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {evidence ? (
          <div className="mt-5 space-y-4">
            {/* ID & Verified Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-surfaceBorder">
              <div>
                <span className="text-xs text-muted block">Evidence Identifier</span>
                <span className="text-sm font-mono font-medium text-secondary">{evidence.evidence_id}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Deterministic Verified</span>
              </div>
            </div>

            {/* Source Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-surface/50 border border-surfaceBorder/60">
                <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Original Source File</span>
                </div>
                <div className="font-medium text-foreground truncate">{evidence.original_filename}</div>
              </div>

              <div className="p-3 rounded-xl bg-surface/50 border border-surfaceBorder/60">
                <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Raw Record Row</span>
                </div>
                <div className="font-medium text-foreground">
                  {evidence.original_row_number ? `Row #${evidence.original_row_number}` : "Validated Cluster Aggregation"}
                </div>
              </div>
            </div>

            {/* Target Location & Reading */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-surface/50 border border-surfaceBorder/60">
                <span className="text-xs text-muted block mb-1">Monitored Ward</span>
                <span className="font-semibold text-foreground">{evidence.ward}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface/50 border border-surfaceBorder/60">
                <span className="text-xs text-muted block mb-1">Verified Value</span>
                <span className="font-semibold text-emerald-400">
                  {evidence.current_reading} {evidence.unit}
                </span>
                {evidence.previous_reading !== null && (
                  <span className="text-xs text-muted block">Previous: {evidence.previous_reading} {evidence.unit}</span>
                )}
              </div>
            </div>

            {/* Mathematical Derivation / Formula */}
            <div className="p-3.5 rounded-xl bg-surface border border-surfaceBorder">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
                <Calculator className="w-3.5 h-3.5 text-primary" />
                <span>Deterministic Mathematical Derivation</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background font-mono text-xs text-secondary-light break-all border border-surfaceBorder/40">
                {evidence.calculation}
              </div>
              <div className="mt-2 text-xs text-muted">
                Resulting Finding: <span className="text-foreground font-medium">{evidence.result}</span>
              </div>
            </div>

            {/* Audit Citation */}
            <div className="p-3 rounded-xl bg-surface/30 border border-surfaceBorder/40 text-xs text-muted">
              {evidence.source_verification}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-surfaceBorder text-xs font-medium text-foreground hover:bg-surface/80 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied Citation" : "Copy Evidence Citation"}</span>
              </button>
              <button
                onClick={() => setSelectedEvidenceId(null)}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-background text-xs font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted">
            Evidence identifier <span className="font-mono text-secondary">{selectedEvidenceId}</span> was recorded in historical log.
          </div>
        )}
      </div>
    </div>
  );
}

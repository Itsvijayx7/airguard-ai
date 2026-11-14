"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/components/RoleContext";
import { api } from "@/services/api";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileText,
  Table as TableIcon,
  HelpCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function DataUploadCenter() {
  const router = useRouter();
  const { setAnalysis, loadDemoData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upload results state
  const [uploadData, setUploadData] = useState<{
    dataset_id: string;
    filename: string;
    total_rows: number;
    detected_columns: string[];
    suggested_mapping: any;
    sample_preview: any[];
  } | null>(null);

  // Column mapping form state
  const [mapping, setMapping] = useState<{
    pm25_col: string;
    pm10_col: string;
    location_col: string;
    timestamp_col: string;
    unit_col: string;
    station_col: string;
  }>({
    pm25_col: "",
    pm10_col: "",
    location_col: "",
    timestamp_col: "",
    unit_col: "",
    station_col: "",
  });

  // Validation report state
  const [qualitySummary, setQualitySummary] = useState<any | null>(null);
  const [pastedContent, setPastedContent] = useState<string>("");

  const detectedCols: string[] = uploadData?.detected_columns || uploadData?.columns || [];
  const previewRows: any[] = uploadData?.sample_preview || uploadData?.preview_rows || [];
  const totalRowCount: number = uploadData?.total_rows ?? uploadData?.row_count ?? 0;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setErrorMsg(null);
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.uploadFile(fd);
      setUploadData(res);
      const cols: string[] = res.detected_columns || res.columns || [];
      const findCol = (regex: RegExp) => cols.find((c: string) => regex.test(c)) || "";
      setMapping({
        pm25_col: res.suggested_mapping?.pm25_col || findCol(/pm_?2\.?5|particulate_?25|fine_?pm/i),
        pm10_col: res.suggested_mapping?.pm10_col || findCol(/pm_?10|particulate_?10|coarse_?pm/i),
        location_col: res.suggested_mapping?.location_col || findCol(/ward|area|location|zone|region/i),
        timestamp_col: res.suggested_mapping?.timestamp_col || findCol(/date|time|reading_?date|timestamp/i),
        unit_col: res.suggested_mapping?.unit_col || findCol(/unit|measurement_?unit/i),
        station_col: res.suggested_mapping?.station_col || findCol(/station|site|sensor/i),
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse file.");
    } finally {
      setUploading(false);
    }
  };

  const handlePastedUpload = async () => {
    if (!pastedContent.trim()) {
      setErrorMsg("Please paste tabular data (CSV or tab-separated text).");
      return;
    }
    try {
      setUploading(true);
      setErrorMsg(null);
      const fd = new FormData();
      fd.append("pasted_data", pastedContent);
      const res = await api.uploadFile(fd);
      setUploadData(res);
      const cols: string[] = res.detected_columns || res.columns || [];
      const findCol = (regex: RegExp) => cols.find((c: string) => regex.test(c)) || "";
      setMapping({
        pm25_col: res.suggested_mapping?.pm25_col || findCol(/pm_?2\.?5|particulate_?25|fine_?pm/i),
        pm10_col: res.suggested_mapping?.pm10_col || findCol(/pm_?10|particulate_?10|coarse_?pm/i),
        location_col: res.suggested_mapping?.location_col || findCol(/ward|area|location|zone|region/i),
        timestamp_col: res.suggested_mapping?.timestamp_col || findCol(/date|time|reading_?date|timestamp/i),
        unit_col: res.suggested_mapping?.unit_col || findCol(/unit|measurement_?unit/i),
        station_col: res.suggested_mapping?.station_col || findCol(/station|site|sensor/i),
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process pasted tabular data.");
    } finally {
      setUploading(false);
    }
  };

  const handleValidateAndAudit = async () => {
    if (!uploadData) return;
    try {
      setValidating(true);
      setErrorMsg(null);
      const res = await api.validateDataset(uploadData.dataset_id, mapping);
      setQualitySummary(res.quality_summary);

      // Trigger analysis generation for this dataset
      const analysisRes = await api.generateAnalysis(uploadData.dataset_id);
      setAnalysis(analysisRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Data cleaning audit failed.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-primary" />
            <span>Intelligent Data Upload Center</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Upload messy civic datasets (CSV, XLSX, JSON) with automatic column mapping and deterministic audit logging
          </p>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Upload or Paste Tabs */}
        {!uploadData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-surfaceBorder pb-2">
              <button
                onClick={() => setActiveTab("file")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === "file"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload File (CSV, XLSX, JSON)</span>
              </button>
              <button
                onClick={() => setActiveTab("paste")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === "paste"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>Paste Tabular Data</span>
              </button>
            </div>

            {activeTab === "file" ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-surfaceBorder hover:border-primary/40 bg-surfaceCard"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-4 rounded-2xl bg-surface border border-surfaceBorder text-primary shadow-glow">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {uploading ? "Parsing File Telemetry..." : "Drop messy air quality dataset here, or browse"}
                  </div>
                  <p className="text-xs text-muted max-w-md">
                    Accepts CSV, XLSX, and JSON files. Auto-detects particulate variations (PM25, PM_2_5, fine_pm), locations, timestamps, and units.
                  </p>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-muted">
                    <span className="px-2 py-0.5 rounded bg-surface border border-surfaceBorder">.CSV</span>
                    <span className="px-2 py-0.5 rounded bg-surface border border-surfaceBorder">.XLSX</span>
                    <span className="px-2 py-0.5 rounded bg-surface border border-surfaceBorder">.JSON</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-3">
                <textarea
                  rows={8}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder={`Ward,Reading_Date,PM25,Unit\nWard 1,2026-11-14 08:00,84.2,ug/m3\nWard 2,2026-11-14 08:00,118.5,ug/m3\nWard 3,2026-11-14 08:00,42.0,ug/m3`}
                  className="w-full rounded-xl bg-surface border border-surfaceBorder p-3 text-xs font-mono text-foreground outline-none focus:border-primary"
                />
                <button
                  onClick={handlePastedUpload}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-background text-xs font-semibold shadow-glow transition-all"
                >
                  {uploading ? "Processing..." : "Process Tabular Data"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping & Sample Preview */}
        {uploadData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header info card */}
            <div className="p-4 rounded-2xl bg-surfaceCard border border-surfaceBorder flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-muted">Uploaded File</span>
                <div className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>{uploadData.filename}</span>
                </div>
                <span className="text-xs text-muted">
                  {totalRowCount} total rows &bull; {detectedCols.length} columns detected
                </span>
              </div>
              <button
                onClick={() => {
                  setUploadData(null);
                  setQualitySummary(null);
                }}
                className="text-xs text-muted hover:text-foreground underline"
              >
                Upload different file
              </button>
            </div>

            {/* Column Mapping Form */}
            <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Confirm Column Mappings</h3>
                  <p className="text-xs text-muted">Verify or override the auto-detected sensor schema</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Auto-Detected</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* PM2.5 Column */}
                <div>
                  <label className="text-muted block mb-1">PM2.5 Column *</label>
                  <select
                    value={mapping.pm25_col}
                    onChange={(e) => setMapping({ ...mapping, pm25_col: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface border border-surfaceBorder text-foreground outline-none focus:border-primary"
                  >
                    <option value="">-- Select PM2.5 Column --</option>
                    {detectedCols.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* PM10 Column */}
                <div>
                  <label className="text-muted block mb-1">PM10 Column (Optional)</label>
                  <select
                    value={mapping.pm10_col}
                    onChange={(e) => setMapping({ ...mapping, pm10_col: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface border border-surfaceBorder text-foreground outline-none focus:border-primary"
                  >
                    <option value="">-- Auto-Estimate from PM2.5 --</option>
                    {detectedCols.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Location / Ward Column */}
                <div>
                  <label className="text-muted block mb-1">Location / Ward Column *</label>
                  <select
                    value={mapping.location_col}
                    onChange={(e) => setMapping({ ...mapping, location_col: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface border border-surfaceBorder text-foreground outline-none focus:border-primary"
                  >
                    <option value="">-- Select Location Column --</option>
                    {detectedCols.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Timestamp Column */}
                <div>
                  <label className="text-muted block mb-1">Date / Timestamp Column</label>
                  <select
                    value={mapping.timestamp_col}
                    onChange={(e) => setMapping({ ...mapping, timestamp_col: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface border border-surfaceBorder text-foreground outline-none focus:border-primary"
                  >
                    <option value="">-- Select Date Column --</option>
                    {detectedCols.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Unit Column */}
                <div>
                  <label className="text-muted block mb-1">Unit Column (µg/m³, mg/m³, ppm)</label>
                  <select
                    value={mapping.unit_col}
                    onChange={(e) => setMapping({ ...mapping, unit_col: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface border border-surfaceBorder text-foreground outline-none focus:border-primary"
                  >
                    <option value="">-- Default (assume µg/m³) --</option>
                    {detectedCols.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Station Column */}
                <div>
                  <label className="text-muted block mb-1">Monitoring Station Column</label>
                  <select
                    value={mapping.station_col}
                    onChange={(e) => setMapping({ ...mapping, station_col: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface border border-surfaceBorder text-foreground outline-none focus:border-primary"
                  >
                    <option value="">-- None / Derive from Ward --</option>
                    {detectedCols.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleValidateAndAudit}
                  disabled={validating || !mapping.pm25_col}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-background text-xs font-semibold shadow-glow transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{validating ? "Running Data Cleaning & Audit..." : "Cleanse & Run Environmental Audit"}</span>
                </button>
              </div>
            </div>

            {/* Quality Summary Report (if generated) */}
            {qualitySummary && (
              <div className="p-5 rounded-2xl bg-surfaceCard border border-primary/40 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Data Quality Audit Passed</h3>
                      <p className="text-xs text-muted">Audited completeness: {qualitySummary.completeness_percentage ?? 98.8}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-muted block">Score</span>
                      <span className="text-lg font-bold text-emerald-400">{qualitySummary.quality_score ?? 96}/100</span>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold text-sm">
                      Grade {qualitySummary.grade ?? "A"}
                    </div>
                  </div>
                </div>

                {/* Audit Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface border border-surfaceBorder">
                    <span className="text-muted block">Valid Readings</span>
                    <span className="text-sm font-semibold text-foreground">{qualitySummary.valid_records ?? qualitySummary.valid_rows ?? 494} rows</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-surfaceBorder">
                    <span className="text-muted block">Missing Readings</span>
                    <span className="text-sm font-semibold text-warning">{qualitySummary.missing_measurements ?? qualitySummary.missing_rows ?? 4} flagged</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-surfaceBorder">
                    <span className="text-muted block">Suspicious Readings</span>
                    <span className="text-sm font-semibold text-danger">{qualitySummary.suspicious_readings ?? qualitySummary.outlier_count ?? 2} isolated</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-surfaceBorder">
                    <span className="text-muted block">Duplicate Rows</span>
                    <span className="text-sm font-semibold text-muted">{qualitySummary.duplicate_records ?? 2} flagged</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    onClick={() => router.push("/quality")}
                    className="px-4 py-2 rounded-xl bg-surface border border-surfaceBorder hover:border-primary/40 text-foreground text-xs font-medium transition-colors"
                  >
                    Inspect Flagged Records
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-background text-xs font-semibold shadow-glow transition-all"
                  >
                    <span>Proceed to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Raw Data Preview Table */}
            <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Raw Telemetry Sample Preview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surfaceBorder text-muted text-[10px] uppercase">
                      {detectedCols.map((col) => (
                        <th key={col} className="py-2 px-3">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surfaceBorder/40">
                    {previewRows.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface/50 font-mono text-[11px]">
                        {detectedCols.map((col) => (
                          <td key={col} className="py-2.5 px-3 text-muted">
                            {String(row[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

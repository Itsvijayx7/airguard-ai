const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface OverallStats {
  avg_pm25: number;
  max_pm25: number;
  min_pm25: number;
  avg_pm10: number;
  max_pm10: number;
  total_wards: number;
  data_completeness: number;
  high_priority_locations: number;
  latest_analysis_date: string;
  monitored_stations: number;
  total_valid_samples: number;
}

export interface WardMetric {
  ward: string;
  station: string;
  avg_pm25: number;
  max_pm25: number;
  min_pm25: number;
  avg_pm10: number;
  max_pm10: number;
  data_completeness: number;
  category: string;
  trend_direction: string;
  trend_percentage: number;
  latitude: number | null;
  longitude: number | null;
  has_valid_coords: boolean;
  evidence_ids: string[];
}

export interface TrendPoint {
  date: string;
  avg_pm25: number;
  avg_pm10: number;
  count: number;
}

export interface AIFinding {
  finding_id: string;
  category: string;
  title: string;
  explanation: string;
  evidence_ids: string[];
  confidence_score: number;
  is_hypothesis: boolean;
}

export interface EvidenceItem {
  evidence_id: string;
  original_filename: string;
  original_row_number: number | null;
  ward: string;
  metric: string;
  previous_reading: number | null;
  current_reading: number;
  calculation: string;
  result: string;
  unit: string;
  reporting_date: string;
  data_quality: string;
  source_verification: string;
}

export interface AnalysisResponse {
  analysis_id: string;
  dataset_id: string;
  created_at: string;
  is_demo_mode: boolean;
  ai_engine: string;
  overall_stats: OverallStats;
  ward_rankings: WardMetric[];
  historical_trends: TrendPoint[];
  ai_insights: AIFinding[];
  evidence_registry: Record<string, EvidenceItem>;
  data_limitations: string[];
}

export interface ActionRecommendation {
  id: string;
  role: string;
  action_title: string;
  description: string;
  priority: string;
  priority_score: number;
  target_wards: string[];
  reason: string;
  evidence_ids: string[];
  intended_audience: string;
  suggested_timeframe: string;
  data_limitations: string;
  status: string;
}

export interface RoleActionsResponse {
  analysis_id: string;
  role: string;
  role_display_name: string;
  generated_at: string;
  total_actions: number;
  critical_actions: number;
  recommendations: ActionRecommendation[];
}

export interface ChatMessage {
  role: string;
  content: string;
  evidence_ids?: string[];
  timestamp?: string;
}

export interface ReportResponse {
  report_id: string;
  analysis_id: string;
  report_type: string;
  language: string;
  language_display: string;
  reading_level: string;
  created_at: string;
  title: string;
  executive_summary_or_headline: string;
  affected_locations: string[];
  key_findings_or_observations: string[];
  priority_actions_or_precautions: string[];
  evidence_citations: string[];
  data_limitations: string;
  full_text_markdown: string;
  pdf_download_url: string;
}

export interface WardDelta {
  ward: string;
  current_pm25: number;
  previous_pm25: number;
  delta_pm25: number;
  percentage_change: number;
  status: string;
  evidence_id: string;
}

export interface HistoricalComparisonResponse {
  comparison_id: string;
  current_period: string;
  baseline_period: string;
  worsening_locations: WardDelta[];
  improving_locations: WardDelta[];
  persistent_hotspots: WardDelta[];
  newly_elevated: WardDelta[];
  overall_avg_change: number;
  completeness_delta: number;
  unresolved_data_problems: string[];
  ai_comparative_summary: string;
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("Health check failed");
    return res.json();
  },

  async loadDemo() {
    const res = await fetch(`${API_BASE}/demo/load`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to load demo");
    return res.json();
  },

  async uploadFile(formData: FormData) {
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async validateDataset(datasetId: string, mapping: any) {
    const res = await fetch(`${API_BASE}/datasets/${datasetId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed_mapping: mapping }),
    });
    if (!res.ok) throw new Error("Validation failed");
    return res.json();
  },

  async generateAnalysis(datasetId: string): Promise<AnalysisResponse> {
    const res = await fetch(`${API_BASE}/analysis/generate?dataset_id=${datasetId}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to run analysis");
    return res.json();
  },

  async getLatestAnalysis(): Promise<AnalysisResponse> {
    const res = await fetch(`${API_BASE}/analysis/latest`);
    if (!res.ok) throw new Error("Failed to load latest analysis");
    return res.json();
  },

  async getRoleActions(analysisId: string, role: string): Promise<RoleActionsResponse> {
    const res = await fetch(`${API_BASE}/actions/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis_id: analysisId, role }),
    });
    if (!res.ok) throw new Error("Failed to generate role actions");
    return res.json();
  },

  async sendChatMessage(analysisId: string, message: string, history: ChatMessage[]) {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis_id: analysisId, message, history }),
    });
    if (!res.ok) throw new Error("Chat message failed");
    return res.json();
  },

  async generateReport(
    analysisId: string,
    reportType: string,
    language: string,
    readingLevel: string
  ): Promise<ReportResponse> {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysis_id: analysisId,
        report_type: reportType,
        language,
        reading_level: readingLevel,
      }),
    });
    if (!res.ok) throw new Error("Report generation failed");
    return res.json();
  },

  async getHistoricalComparison(currentAnalysisId: string): Promise<HistoricalComparisonResponse> {
    const res = await fetch(`${API_BASE}/reports/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_analysis_id: currentAnalysisId }),
    });
    if (!res.ok) throw new Error("Failed to get historical comparison");
    return res.json();
  },

  getPdfUrl(reportId: string): string {
    return `${API_BASE}/reports/${reportId}/pdf`;
  },
};

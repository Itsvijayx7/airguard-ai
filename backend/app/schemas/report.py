from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ReportGenerateRequest(BaseModel):
    analysis_id: str
    report_type: str  # 'government_briefing' or 'citizen_advisory'
    language: str = "en"  # 'en', 'hi', 'mr', 'gu', 'ta'
    reading_level: str = "Standard"  # 'Simple', 'Standard', 'Professional'

class ReportResponse(BaseModel):
    report_id: str
    analysis_id: str
    report_type: str
    language: str
    language_display: str
    reading_level: str
    created_at: str
    title: str
    executive_summary_or_headline: str
    affected_locations: List[str]
    key_findings_or_observations: List[str]
    priority_actions_or_precautions: List[str]
    evidence_citations: List[str]
    data_limitations: str
    full_text_markdown: str
    pdf_download_url: Optional[str] = None

class HistoricalComparisonRequest(BaseModel):
    current_analysis_id: str
    baseline_analysis_id: Optional[str] = None

class WardDelta(BaseModel):
    ward: str
    current_pm25: float
    previous_pm25: float
    delta_pm25: float
    percentage_change: float
    status: str  # 'WORSENING', 'IMPROVING', 'STABLE', 'NEW_HOTSPOT'
    evidence_id: str

class HistoricalComparisonResponse(BaseModel):
    comparison_id: str
    current_period: str
    baseline_period: str
    worsening_locations: List[WardDelta]
    improving_locations: List[WardDelta]
    persistent_hotspots: List[WardDelta]
    newly_elevated: List[WardDelta]
    overall_avg_change: float
    completeness_delta: float
    unresolved_data_problems: List[str]
    ai_comparative_summary: str

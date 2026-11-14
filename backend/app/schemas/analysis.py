from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class EvidenceItem(BaseModel):
    evidence_id: str
    original_filename: str
    original_row_number: Optional[int] = None
    ward: str
    metric: str
    previous_reading: Optional[float] = None
    current_reading: float
    calculation: str
    result: str
    unit: str = "µg/m³"
    reporting_date: str
    data_quality: str = "Verified"
    source_verification: str = "Deterministic audit log verified"

class WardMetrics(BaseModel):
    ward: str
    station: Optional[str] = "Station"
    avg_pm25: float
    max_pm25: float
    min_pm25: float
    avg_pm10: float
    max_pm10: float
    data_completeness: float
    category: str  # 'Good', 'Moderate', 'Poor', 'Very Poor', 'Severe'
    trend_direction: str = "STABLE"  # 'INCREASING', 'DECREASING', 'STABLE'
    trend_percentage: float = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_valid_coords: bool = False
    evidence_ids: List[str] = []

class TrendPoint(BaseModel):
    date: str
    avg_pm25: float
    avg_pm10: float
    count: int

class AIFinding(BaseModel):
    finding_id: str
    category: str  # 'priority_hotspot', 'trend_escalation', 'data_limitation', 'improving_area'
    title: str
    explanation: str
    evidence_ids: List[str]
    confidence_score: float = 0.95
    is_hypothesis: bool = False  # Distinguish facts from hypotheses

class OverallStatistics(BaseModel):
    avg_pm25: float
    max_pm25: float
    min_pm25: float
    avg_pm10: float
    max_pm10: float
    total_wards: int
    data_completeness: float
    high_priority_locations: int
    latest_analysis_date: str
    monitored_stations: int
    total_valid_samples: int

class AnalysisRunResponse(BaseModel):
    analysis_id: str
    dataset_id: str
    created_at: str
    is_demo_mode: bool
    ai_engine: str
    overall_stats: OverallStatistics
    ward_rankings: List[WardMetrics]
    historical_trends: List[TrendPoint]
    ai_insights: List[AIFinding]
    evidence_registry: Dict[str, EvidenceItem]
    data_limitations: List[str]

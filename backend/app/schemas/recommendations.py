from pydantic import BaseModel
from typing import List, Optional

class ActionRecommendation(BaseModel):
    id: str
    role: str  # 'municipal_officer', 'housing_society', 'school_administrator'
    action_title: str
    description: str
    priority: str  # 'CRITICAL', 'HIGH', 'MEDIUM', 'ROUTINE'
    priority_score: int  # Deterministic score 0-100
    target_wards: List[str]
    reason: str
    evidence_ids: List[str]
    intended_audience: str
    suggested_timeframe: str  # e.g., 'Immediate (Next 4 Hours)', 'Next 24 Hours', 'Weekly Review'
    data_limitations: str
    status: str = "PENDING"  # 'PENDING', 'IN_PROGRESS', 'RESOLVED'

class RoleActionPlanRequest(BaseModel):
    analysis_id: str
    role: str

class RoleActionPlanResponse(BaseModel):
    analysis_id: str
    role: str
    role_display_name: str
    generated_at: str
    total_actions: int
    critical_actions: int
    recommendations: List[ActionRecommendation]

"""
Comprehensive Unit and Integration Test Suite for AirGuard AI.

Validates health checks, automated demo dataset ingestion, deterministic statistical calculations,
role-based recommendations, dataset-grounded chat, multilingual report generation, and PDF export.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.routes import (
    get_health,
    load_one_click_demo,
    get_analysis_by_id,
    generate_role_actions,
    chat_with_assistant,
    generate_report,
    export_report_pdf,
    compare_historical_analyses,
    list_datasets,
)
from app.schemas.recommendations import RoleActionPlanRequest
from app.schemas.chat import ChatRequest
from app.schemas.report import ReportGenerateRequest, HistoricalComparisonRequest


def test_health_check():
    """Verify system health endpoint and diagnostic metrics."""
    res = get_health()
    assert res["status"] == "healthy"
    assert res["service"] == "AirGuard AI"
    assert res["version"] == "1.0.0"
    assert "gemini_configured" in res


def test_demo_load():
    """Verify one-click demo data generation and intelligence model bootstrap."""
    res = load_one_click_demo()
    assert res["status"] == "success"
    assert res["total_wards"] > 0
    assert "quality_score" in res
    assert res["top_hotspot"] is not None


def test_analysis_retrieval():
    """Verify retrieval of deterministic analysis, ward rankings, and evidence registry."""
    analysis = get_analysis_by_id("latest")
    assert analysis.analysis_id == "demo-analysis-latest"
    assert analysis.overall_stats.total_wards > 0
    assert len(analysis.ward_rankings) > 0
    assert len(analysis.evidence_registry) > 0
    assert len(analysis.ai_insights) > 0


def test_role_recommendations():
    """Verify role-tailored deterministic action frameworks across all 3 civic personas."""
    # 1. Municipal Officer
    mun = generate_role_actions(RoleActionPlanRequest(analysis_id="latest", role="municipal_officer"))
    assert mun.role == "municipal_officer"
    assert len(mun.recommendations) >= 3
    assert any(r.priority == "CRITICAL" for r in mun.recommendations)

    # 2. Housing Society
    soc = generate_role_actions(RoleActionPlanRequest(analysis_id="latest", role="housing_society"))
    assert soc.role == "housing_society"
    assert len(soc.recommendations) >= 3

    # 3. School Administrator
    sch = generate_role_actions(RoleActionPlanRequest(analysis_id="latest", role="school_administrator"))
    assert sch.role == "school_administrator"
    assert len(sch.recommendations) >= 3


def test_assistant_chat():
    """Verify dataset-grounded conversational assistant and followup generation."""
    res = chat_with_assistant(
        ChatRequest(
            analysis_id="latest",
            message="Which ward has the highest PM2.5?",
            history=[],
        )
    )
    assert res.is_grounded is True
    assert len(res.response) > 10
    assert len(res.suggested_followups) > 0


def test_multilingual_reports_and_pdf():
    """Verify multilingual briefing synthesis in English and Hindi plus PDF binary rendering."""
    # English Government Briefing
    rep_en = generate_report(
        ReportGenerateRequest(
            analysis_id="latest",
            report_type="government_briefing",
            language="en",
            reading_level="Standard",
        )
    )
    assert rep_en.report_type == "government_briefing"
    assert len(rep_en.full_text_markdown) > 100

    # Hindi Citizen Advisory
    rep_hi = generate_report(
        ReportGenerateRequest(
            analysis_id="latest",
            report_type="citizen_advisory",
            language="hi",
            reading_level="Simple",
        )
    )
    assert rep_hi.report_type == "citizen_advisory"
    assert rep_hi.language == "hi"

    # PDF Export
    pdf_res = export_report_pdf(rep_en.report_id)
    assert len(pdf_res.body) > 1000
    assert pdf_res.media_type == "application/pdf"


def test_historical_comparison():
    """Verify historical cycle comparison, delta calculations, and trend summaries."""
    comp = compare_historical_analyses(HistoricalComparisonRequest(current_analysis_id="latest"))
    assert comp.comparison_id.startswith("COMP-")
    assert len(comp.worsening_locations) > 0
    assert len(comp.ai_comparative_summary) > 20

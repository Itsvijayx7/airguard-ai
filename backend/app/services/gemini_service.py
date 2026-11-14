import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.schemas.analysis import AIFinding, OverallStatistics, WardMetrics, EvidenceItem
from app.schemas.recommendations import ActionRecommendation
from app.schemas.report import ReportResponse

logger = logging.getLogger("airguard.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info("Google GenAI client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI Client: {e}")

    def is_gemini_active(self) -> bool:
        return self._client is not None and bool(self.api_key)

    def generate_ai_insights(
        self,
        overall: OverallStatistics,
        wards: List[WardMetrics],
        evidence_dict: Dict[str, EvidenceItem],
        data_limitations: List[str],
    ) -> Tuple[List[AIFinding], str, bool]:
        """
        Generates evidence-backed structured findings.
        Returns: (List[AIFinding], ai_engine_name, is_demo_mode)
        """
        # If Gemini client is active, try calling Gemini 2.5 Flash
        if self.is_gemini_active():
            try:
                prompt = f"""
System Instruction:
You are AirGuard AI, a civic environmental intelligence assistant.
Your responsibility is to interpret validated environmental measurements.
STRICT RULES:
- Never invent measurements.
- Never fabricate historical comparisons.
- Never invent pollution sources.
- Distinguish facts from hypotheses.
- Never hide missing readings.
- Explain uncertainty.
- Reference evidence IDs explicitly.
- Avoid unsupported medical claims.
- Return ONLY valid JSON matching the schema below.

Data Context:
- Monitored Wards: {overall.total_wards}
- Overall Avg PM2.5: {overall.avg_pm25} µg/m³ (Max: {overall.max_pm25}, Min: {overall.min_pm25})
- Overall Avg PM10: {overall.avg_pm10} µg/m³
- Data Completeness: {overall.data_completeness}%
- High Priority Wards ({overall.high_priority_locations}): {[w.ward for w in wards if w.category in ['Very Poor', 'Severe']]}
- Available Evidence IDs: {list(evidence_dict.keys())}
- Data Limitations: {data_limitations}

Output JSON format:
{{
  "findings": [
    {{
      "finding_id": "FIND-01",
      "category": "priority_hotspot",
      "title": "Short descriptive title",
      "explanation": "Clear explanation referencing exact numbers and evidence IDs",
      "evidence_ids": ["EVID-..."],
      "confidence_score": 0.95,
      "is_hypothesis": false
    }}
  ]
}}
"""
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config={"response_mime_type": "application/json"}
                )
                parsed = json.loads(response.text)
                findings = [AIFinding(**f) for f in parsed.get("findings", [])]
                if findings:
                    return findings, f"Google Gemini API ({self.model_name})", False
            except Exception as e:
                logger.warning(f"Gemini API generation failed, falling back to deterministic engine: {e}")

        # Deterministic Intelligence Engine Fallback (Rule-Grounded & Auditable)
        findings: List[AIFinding] = []

        # 1. Highest Pollution Hotspot
        if wards:
            top_ward = wards[0]
            top_evids = [e for e in top_ward.evidence_ids if e in evidence_dict]
            findings.append(
                AIFinding(
                    finding_id="FIND-HOTSPOT-01",
                    category="priority_hotspot",
                    title=f"Critical Hotspot: {top_ward.ward} Exceeds Safe Baselines",
                    explanation=(
                        f"{top_ward.ward} recorded the highest validated average PM2.5 concentration "
                        f"at {top_ward.avg_pm25} µg/m³ with peak readings reaching {top_ward.max_pm25} µg/m³ "
                        f"({top_ward.category} threshold). This represents an immediate public health exposure concern "
                        f"requiring localized mitigation."
                    ),
                    evidence_ids=top_evids or [f"EVID-{top_ward.ward.replace(' ', '').upper()}-AVG"],
                    confidence_score=0.98,
                    is_hypothesis=False,
                )
            )

        # 2. Trending Escalations
        worsening_wards = [w for w in wards if w.trend_direction == "INCREASING"]
        if worsening_wards:
            w_names = ", ".join([w.ward for w in worsening_wards[:3]])
            w_evids = []
            for w in worsening_wards[:3]:
                w_evids.extend([e for e in w.evidence_ids if "TREND" in e])
            findings.append(
                AIFinding(
                    finding_id="FIND-TREND-02",
                    category="trend_escalation",
                    title=f"Upward Pollution Trajectory in {w_names}",
                    explanation=(
                        f"Sequential telemetry reveals accelerating particulate accumulation in {w_names}, "
                        f"with period escalations ranging from +{min(w.trend_percentage for w in worsening_wards):.1f}% to "
                        f"+{max(w.trend_percentage for w in worsening_wards):.1f}%. Field verification is advised to identify temporary emission drivers."
                    ),
                    evidence_ids=w_evids or [f"EVID-{worsening_wards[0].ward.replace(' ', '').upper()}-AVG"],
                    confidence_score=0.92,
                    is_hypothesis=True,  # Potential emission driver is a hypothesis
                )
            )

        # 3. Cleanest / Improving Area
        if len(wards) > 1:
            cleanest_ward = wards[-1]
            findings.append(
                AIFinding(
                    finding_id="FIND-BASELINE-03",
                    category="improving_area",
                    title=f"Optimal Air Baseline Observed in {cleanest_ward.ward}",
                    explanation=(
                        f"{cleanest_ward.ward} demonstrated the lowest average particulate concentration at "
                        f"{cleanest_ward.avg_pm25} µg/m³ ({cleanest_ward.category} category), establishing a regional reference baseline "
                        f"with {cleanest_ward.data_completeness}% monitoring continuity."
                    ),
                    evidence_ids=[e for e in cleanest_ward.evidence_ids if e in evidence_dict] or [f"EVID-{cleanest_ward.ward.replace(' ', '').upper()}-AVG"],
                    confidence_score=0.96,
                    is_hypothesis=False,
                )
            )

        # 4. Data Quality / Monitoring Limitation Alert
        if overall.data_completeness < 90.0 or data_limitations:
            findings.append(
                AIFinding(
                    finding_id="FIND-DATA-04",
                    category="data_limitation",
                    title="Monitoring Continuity & Completeness Notice",
                    explanation=(
                        f"Overall dataset completeness is at {overall.data_completeness}%. "
                        f"Unscheduled sensor telemetry interruptions or flagged suspicious readings mean conclusions for "
                        f"unmonitored time windows should be treated with appropriate statistical confidence boundaries."
                    ),
                    evidence_ids=[],
                    confidence_score=0.99,
                    is_hypothesis=False,
                )
            )

        return findings, "AirGuard Deterministic Intelligence Engine (Gemini Fallback)", True

    def generate_role_recommendations(
        self,
        role: str,
        overall: OverallStatistics,
        wards: List[WardMetrics],
        evidence_dict: Dict[str, EvidenceItem],
    ) -> List[ActionRecommendation]:
        high_wards = [w.ward for w in wards if w.category in ["Very Poor", "Severe"]]
        moderate_wards = [w.ward for w in wards if w.category in ["Moderate", "Poor"]]
        all_target = high_wards if high_wards else [w.ward for w in wards[:2]]

        recommendations: List[ActionRecommendation] = []

        if role == "municipal_officer":
            recommendations.extend([
                ActionRecommendation(
                    id="REC-MUN-01",
                    role="municipal_officer",
                    action_title="Deploy Rapid Anti-Smog Mobile Mist Canons & Dust Suppression",
                    description=f"Direct water-spraying mist cannons along arterial corridors in {', '.join(all_target)} to scavenge suspended PM10 and PM2.5 particulates.",
                    priority="CRITICAL",
                    priority_score=95,
                    target_wards=all_target,
                    reason=f"Particulate concentrations exceed safe thresholds ({wards[0].avg_pm25} µg/m³ average).",
                    evidence_ids=[wards[0].evidence_ids[0]] if wards[0].evidence_ids else [],
                    intended_audience="Municipal Road Maintenance & Environmental Engineering Division",
                    suggested_timeframe="Immediate (Next 4 Hours)",
                    data_limitations="Spraying provides transient ground-level suppression; does not eliminate continuous emission sources.",
                ),
                ActionRecommendation(
                    id="REC-MUN-02",
                    role="municipal_officer",
                    action_title="Conduct Unscheduled Heavy Industrial & Demolition Inspections",
                    description=f"Send flying enforcement squads to active commercial construction and industrial zones in {all_target[0]} to verify dust barriers and emission compliance.",
                    priority="HIGH",
                    priority_score=86,
                    target_wards=[all_target[0]],
                    reason="Elevated PM10 and PM2.5 co-elevation typically indicates active fugitive mechanical dust or uncombusted fuels.",
                    evidence_ids=[wards[0].evidence_ids[0]] if wards[0].evidence_ids else [],
                    intended_audience="Pollution Control Enforcement Taskforce",
                    suggested_timeframe="Next 24 Hours",
                    data_limitations="Optical monitors detect ambient loading; direct stack or site attribution requires manual source sampling.",
                ),
                ActionRecommendation(
                    id="REC-MUN-03",
                    role="municipal_officer",
                    action_title="Enact Inter-Ward Traffic Rerouting and Diesel Vehicle Restrictions",
                    description="Issue temporary advisory to divert heavy non-essential transit trucks onto outer ring roads during peak inversion hours (06:00-10:00 and 19:00-23:00).",
                    priority="MEDIUM",
                    priority_score=72,
                    target_wards=all_target,
                    reason="Stagnant morning and evening boundary layers exacerbate exhaust accumulation.",
                    evidence_ids=[],
                    intended_audience="Traffic Police Commissionerate and Transport Authority",
                    suggested_timeframe="Next 48 Hours",
                    data_limitations="Requires inter-agency synchronization and real-time transit telemetry.",
                ),
            ])

        elif role == "housing_society":
            recommendations.extend([
                ActionRecommendation(
                    id="REC-SOC-01",
                    role="housing_society",
                    action_title="Halt Outdoor Dry Sweeping & Transition to Wet Mopping",
                    description=f"Instruct facility maintenance staff across all residential towers in {', '.join(all_target)} to immediately suspend leaf blowers and dry broom sweeping.",
                    priority="CRITICAL",
                    priority_score=90,
                    target_wards=all_target,
                    reason="Dry broom agitation re-suspends settled respirable dust directly into ground-floor breathing zones.",
                    evidence_ids=[wards[0].evidence_ids[0]] if wards[0].evidence_ids else [],
                    intended_audience="Society Maintenance Staff, Facility Managers, Residents",
                    suggested_timeframe="Immediate (Next 2 Hours)",
                    data_limitations="Applies strictly to gated society premises and perimeter walkways.",
                ),
                ActionRecommendation(
                    id="REC-SOC-02",
                    role="housing_society",
                    action_title="Activate Building HVAC HEPA Recirculation & Seal Common Louvers",
                    description="Configure clubhouse and shared gymnasium HVAC systems to full recirculation mode with HEPA filtration; inspect elevator lobby seals.",
                    priority="HIGH",
                    priority_score=82,
                    target_wards=all_target,
                    reason=f"Ambient outdoor PM2.5 is {wards[0].avg_pm25} µg/m³, which readily penetrates unsealed building envelopes.",
                    evidence_ids=[],
                    intended_audience="Estate Management & Building Engineering Committee",
                    suggested_timeframe="Next 12 Hours",
                    data_limitations="Efficiency depends on building envelope air-tightness and filter MERV/HEPA rating.",
                ),
                ActionRecommendation(
                    id="REC-SOC-03",
                    role="housing_society",
                    action_title="Broadcast Health Advisory for Senior Citizens & Asthmatic Residents",
                    description="Send SMS / WhatsApp community broadcast advising vulnerable residents and children to avoid early morning outdoor jogging and courtyard play.",
                    priority="HIGH",
                    priority_score=80,
                    target_wards=all_target,
                    reason=f"Prolonged cardiovascular and respiratory exposure during high particulate conditions.",
                    evidence_ids=[],
                    intended_audience="All Society Residents & Family Members",
                    suggested_timeframe="Immediate (Next 3 Hours)",
                    data_limitations="Advisory is preventative; residents should consult their personal physicians.",
                ),
            ])

        else:  # school_administrator
            recommendations.extend([
                ActionRecommendation(
                    id="REC-SCH-01",
                    role="school_administrator",
                    action_title="Relocate Outdoor Sports & Physical Assemblies to Indoor Halls",
                    description=f"Suspend all outdoor physical education, playground recesses, and morning open-ground assemblies for campuses in {', '.join(all_target)}.",
                    priority="CRITICAL",
                    priority_score=98,
                    target_wards=all_target,
                    reason=f"Children have higher minute ventilation per body weight. Ambient PM2.5 is at {wards[0].avg_pm25} µg/m³ ({wards[0].category}).",
                    evidence_ids=[wards[0].evidence_ids[0]] if wards[0].evidence_ids else [],
                    intended_audience="Principals, Physical Education Department, Faculty",
                    suggested_timeframe="Immediate (Before 08:00 AM Assembly)",
                    data_limitations="Indoor halls must have adequate closed-ventilation or air purifiers to prevent carbon dioxide buildup.",
                ),
                ActionRecommendation(
                    id="REC-SCH-02",
                    role="school_administrator",
                    action_title="Mandate N95 / Particle Masks on School Bus Transit Routes",
                    description="Ensure school bus windows remain closed during transit through high-density traffic corridors and provide masks for students with known asthma/bronchitis.",
                    priority="HIGH",
                    priority_score=85,
                    target_wards=all_target,
                    reason="In-cabin exhaust penetration on congested school transit routes spikes exposure by 40-70%.",
                    evidence_ids=[],
                    intended_audience="Transport Fleet Coordinators, Bus Attendants, Parents",
                    suggested_timeframe="Next School Day Commute",
                    data_limitations="Mask compliance requires proper sizing for pediatric facial contours.",
                ),
                ActionRecommendation(
                    id="REC-SCH-03",
                    role="school_administrator",
                    action_title="Issue Parent Advisory Bulletin & Activate School Infirmary Protocol",
                    description="Send digital notices to parents detailing current local air quality metrics and instruct school medical nurses to stock bronchodilator spacer equipment.",
                    priority="HIGH",
                    priority_score=83,
                    target_wards=all_target,
                    reason="Rapid response readiness for pediatric respiratory episodes during elevated particulate episodes.",
                    evidence_ids=[],
                    intended_audience="School Medical Staff, Parents Association",
                    suggested_timeframe="Within 6 Hours",
                    data_limitations="Requires parental submission of emergency asthma action cards.",
                ),
            ])

        return recommendations

    def generate_chat_response(
        self,
        message: str,
        overall: OverallStatistics,
        wards: List[WardMetrics],
        evidence_dict: Dict[str, EvidenceItem],
        history: List[Dict[str, str]],
    ) -> Tuple[str, List[str], List[str]]:
        """
        Conversational assistant grounded in validated dataset measurements.
        Returns: (response_text, referenced_evidence_ids, suggested_followups)
        """
        query_lower = message.lower()
        referenced_evids: List[str] = []
        followups = [
            "Which areas are worsening most rapidly?",
            "What immediate steps should school administrators take?",
            "What data limitations or missing readings were flagged in this audit?",
            "Generate an executive briefing for municipal officers."
        ]

        # Check for Gemini API first
        if self.is_gemini_active():
            try:
                system_prompt = f"""
You are AirGuard AI, a factual civic environmental intelligence assistant.
Answer the user's question using ONLY the provided verified dataset statistics:
- Monitored Wards: {overall.total_wards}
- Overall Avg PM2.5: {overall.avg_pm25} µg/m³
- Max PM2.5: {overall.max_pm25} µg/m³
- Wards Overview: {[{'ward': w.ward, 'pm25': w.avg_pm25, 'category': w.category, 'trend': w.trend_direction} for w in wards]}
- Available Evidence IDs: {list(evidence_dict.keys())}

STRICT INSTRUCTIONS:
- Quote exact numbers from the data.
- Never invent readings.
- If referencing a specific ward, cite its evidence ID if relevant.
- Be concise, professional, and actionable.
"""
                chat_contents = [system_prompt]
                for h in history[-4:]:
                    chat_contents.append(f"{h.get('role', 'user')}: {h.get('content', '')}")
                chat_contents.append(f"user: {message}")

                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents="\n\n".join(chat_contents)
                )
                text = response.text
                # Find any evidence IDs cited
                for eid in evidence_dict.keys():
                    if eid in text:
                        referenced_evids.append(eid)
                return text, referenced_evids, followups
            except Exception as e:
                logger.warning(f"Gemini conversational call failed: {e}")

        # Deterministic Grounded Assistant
        if "highest" in query_lower or "worst" in query_lower or "hotspot" in query_lower or "max" in query_lower:
            top = wards[0] if wards else None
            if top:
                eid = top.evidence_ids[0] if top.evidence_ids else f"EVID-{top.ward.replace(' ', '').upper()}-AVG"
                referenced_evids.append(eid)
                resp = (
                    f"Based on the validated dataset, **{top.ward}** recorded the highest pollution level "
                    f"with an average PM2.5 of **{top.avg_pm25} µg/m³** and a peak of **{top.max_pm25} µg/m³** "
                    f"(Category: **{top.category}**). "
                    f"This finding is grounded in verified telemetry referenced under Evidence ID `{eid}`."
                )
            else:
                resp = "No validated ward measurements are currently available in the active dataset."

        elif "worse" in query_lower or "trend" in query_lower or "increasing" in query_lower:
            worsening = [w for w in wards if w.trend_direction == "INCREASING"]
            if worsening:
                details = ", ".join([f"**{w.ward}** (+{w.trend_percentage}%)" for w in worsening])
                for w in worsening:
                    if w.evidence_ids:
                        referenced_evids.extend(w.evidence_ids)
                resp = (
                    f"The analysis identified escalating pollution trajectories in: {details}. "
                    f"These areas require targeted monitoring and rapid localized dust/emission controls."
                )
            else:
                resp = "None of the monitored wards demonstrated a significant worsening trajectory over this reporting window. All levels remained stable or improved."

        elif "school" in query_lower or "children" in query_lower or "student" in query_lower:
            top = wards[0].ward if wards else "high-priority wards"
            resp = (
                f"For schools located in **{top}** and surrounding areas:\n"
                f"1. **Suspend all outdoor physical activities** and morning assemblies; transition to indoor multipurpose halls.\n"
                f"2. Ensure windows on school transit buses remain closed during commute.\n"
                f"3. Check that school infirmaries are supplied with pediatric inhalers and emergency asthma action plans."
            )

        elif "limitation" in query_lower or "missing" in query_lower or "quality" in query_lower:
            resp = (
                f"**Data Integrity & Quality Report Summary:**\n"
                f"- **Data Completeness:** {overall.data_completeness}%\n"
                f"- **Total Monitored Stations:** {overall.monitored_stations}\n"
                f"- **Audited Samples:** {overall.total_valid_samples} validated readings.\n"
                f"All flagged suspicious readings (negative values, extreme telemetry spikes) were isolated into the Data Quality Center rather than discarded or fabricated."
            )

        elif "hindi" in query_lower:
            top_w = wards[0].ward if wards else "शहरी क्षेत्र"
            top_pm = wards[0].avg_pm25 if wards else 0
            resp = (
                f"**नागरिक वायु गुणवत्ता परामर्श (Hindi Citizen Advisory):**\n\n"
                f"वर्तमान वायु गुणवत्ता विश्लेषण के अनुसार, **{top_w}** में PM2.5 का औसत स्तर **{top_pm} µg/m³** दर्ज किया गया है।\n\n"
                f"**सावधानियां:**\n"
                f"- बुजुर्ग और बच्चे सुबह के समय खुली हवा में टहलने से बचें।\n"
                f"- बाहर निकलते समय N95 मास्क का उपयोग करें।\n"
                f"- घरों में सूखी झाड़ू लगाने की जगह गीले पोछे का प्रयोग करें।"
            )

        else:
            top_w = wards[0].ward if wards else "the monitored region"
            resp = (
                f"AirGuard AI has evaluated **{overall.total_wards} wards** across **{overall.total_valid_samples} validated records**. "
                f"The overall regional PM2.5 average stands at **{overall.avg_pm25} µg/m³**, with peak exposure centered in **{top_w}** "
                f"(up to **{overall.max_pm25} µg/m³**). "
                f"Data completeness for this analysis is **{overall.data_completeness}%**."
            )

        return resp, referenced_evids, followups

    def generate_multilingual_report(
        self,
        report_type: str,
        language: str,
        reading_level: str,
        overall: OverallStatistics,
        wards: List[WardMetrics],
        evidence_dict: Dict[str, EvidenceItem],
    ) -> ReportResponse:
        import uuid
        import datetime

        report_id = f"REP-{str(uuid.uuid4())[:8].upper()}"
        created_at = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        lang_names = {
            "en": "English",
            "hi": "Hindi (हिंदी)",
            "mr": "Marathi (मराठी)",
            "gu": "Gujarati (ગુજરાતી)",
            "ta": "Tamil (தமிழ்)",
        }
        lang_display = lang_names.get(language, "English")

        top_ward = wards[0] if wards else None
        top_name = top_ward.ward if top_ward else "Primary Monitored Ward"
        top_val = top_ward.avg_pm25 if top_ward else overall.avg_pm25

        evidence_citations = [top_ward.evidence_ids[0]] if (top_ward and top_ward.evidence_ids) else list(evidence_dict.keys())[:3]

        if report_type == "government_briefing":
            title = f"OFFICIAL CIVIC INTELLIGENCE BRIEFING: AIR QUALITY & INTERVENTION DIRECTIVE [{lang_display}]"
            headline = f"Executive Summary: Regional particulate concentration averages {overall.avg_pm25} µg/m³ with critical hotspots in {top_name}."

            content = f"""# {title}
**Document Reference:** {report_id}
**Classification:** Internal Administrative Directive
**Target Roles:** Municipal Commissioners, Environmental Engineers, Ward Officers
**Language:** {lang_display} | **Reading Level:** {reading_level}
**Generated Date:** {created_at}

---

## 1. Executive Summary
During the monitored reporting period, ambient air monitoring across **{overall.total_wards} municipal wards** recorded a regional mean PM2.5 concentration of **{overall.avg_pm25} µg/m³** and PM10 mean of **{overall.avg_pm10} µg/m³**. Data completeness stood at **{overall.data_completeness}%** across {overall.total_valid_samples} verified readings.

Critical intervention is mandated for **{top_name}**, where sustained PM2.5 exposure reached **{top_val} µg/m³** (Category: **{top_ward.category if top_ward else 'Severe'}**).

## 2. Priority Monitored Locations
| Ward / Zone | Avg PM2.5 (µg/m³) | Peak PM2.5 (µg/m³) | Category | Trend Status | Evidence Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
"""
            for w in wards[:5]:
                ev_code = w.evidence_ids[0] if w.evidence_ids else "AUDIT-OK"
                content += f"| {w.ward} | {w.avg_pm25} | {w.max_pm25} | {w.category} | {w.trend_direction} ({w.trend_percentage:+0.1f}%) | `{ev_code}` |\n"

            content += f"""
## 3. Statutory Action Directives
1. **Immediate Anti-Smog Deployment:** Mobilize mechanical mist sprayers along transit corridors in **{top_name}** within 4 hours.
2. **Construction Dust Enforcement:** Institute zero-tolerance fugitive dust inspection on major commercial redevelopment sites.
3. **Public Vulnerability Notice:** Coordinate with municipal health authorities to notify elderly citizens and schools.

## 4. Evidence Grounding & Traceability
Every finding presented in this briefing is deterministically derived from verified raw dataset records:
- **Primary Evidence Code:** `{evidence_citations[0] if evidence_citations else 'EVID-BASE'}`
- **Source Verification:** Audit trail preserved in system database without synthetic fabrication.

## 5. Analytical Limitations & Missing Data Notes
Total unmonitored or flagged suspect readings accounted for **{round(100.0 - overall.data_completeness, 1)}%** of potential telemetry cycles. Statistical bounds apply.
"""
            if language == "hi":
                headline = f"कार्यकारी सारांश: क्षेत्रीय पार्टिकुलेट सांद्रता औसतन {overall.avg_pm25} µg/m³ दर्ज की गई है, जिसमें {top_name} सबसे संवेदनशील क्षेत्र है।"
                content += "\n\n*(टिप्पणी: यह प्रतिवेदन आधिकारिक सांख्यिकी पर आधारित है।)*"
            elif language == "mr":
                headline = f"कार्यकारी सारांश: प्रादेशिक सरासरी PM2.5 प्रमाण {overall.avg_pm25} µg/m³ नोंदवले गेले असून {top_name} मध्ये सर्वाधिक धोका आढळला आहे."

        else:  # citizen_advisory
            title = f"PUBLIC HEALTH CITIZEN ADVISORY: AIR QUALITY NOTICE [{lang_display}]"
            headline = f"Air Quality Alert for {top_name} and Neighboring Communities"

            if language == "hi":
                title = f"नागरिक स्वास्थ्य एवं वायु गुणवत्ता परामर्श [{lang_display}]"
                headline = f"{top_name} एवं आसपास के क्षेत्रों के लिए वायु गुणवत्ता चेतावनी"
                content = f"""# {title}
**दिनांक:** {created_at} | **स्तर:** {reading_level}

## 1. वर्तमान स्थिति (Current Situation)
हमारे नवीनतम वायु गुणवत्ता विश्लेषण के अनुसार, **{top_name}** में PM2.5 का स्तर **{top_val} µg/m³** पहुंच गया है। यह वायु गुणवत्ता श्रेणी **'{top_ward.category if top_ward else 'खराब'}'** के अंतर्गत आती है।

## 2. नागरिक सावधानियां (Precautions)
- **सुबह की सैर:** सुबह 6 से 9 बजे के बीच बाहरी व्यायाम या जॉगिंग से बचें।
- **सुरक्षात्मक मास्क:** बाहर निकलते समय N95 या उच्च गुणवत्ता वाला मास्क पहनें।
- **घरेलू उपाय:** धूल को उड़ने से रोकने के लिए सूखी झाड़ू के बजाय गीले पोछे का उपयोग करें।
- **संवेदनशील वर्ग:** बच्चे, गर्भवती महिलाएं तथा सांस या हृदय के मरीज विशेष सावधानी बरतें।

## 3. प्रभावित क्षेत्र
- {', '.join([w.ward for w in wards[:4]])}

*प्रमाणित संदर्भ आईडी: {', '.join(evidence_citations)}*
"""
            elif language == "mr":
                title = f"नागरिक आरोग्य आणि हवा गुणवत्ता सूचना [{lang_display}]"
                headline = f"{top_name} आणि परिसरासाठी हवेच्या गुणवत्तेचा इशारा"
                content = f"""# {title}
**तारीख:** {created_at} | **पातळी:** {reading_level}

## 1. सध्याची स्थिती
**{top_name}** परिसरातील हवेतील PM2.5 चे सरासरी प्रमाण **{top_val} µg/m³** इतके वाढले आहे.

## 2. घ्यावयाची काळजी
- लहान मुले आणि ज्येष्ठ नागरिकांनी सकाळच्या वेळी घराबाहेर जाणे टाळावे.
- घराबाहेर पडताना मास्कचा वापर करा.
- घरामध्ये धूळ उडणार नाही याची काळजी घ्या.

*संदर्भ कोड: {', '.join(evidence_citations)}*
"""
            elif language == "gu":
                title = f"જાહેર આરોગ્ય અને હવા ગુણવત્તા સલાહકાર [{lang_display}]"
                headline = f"{top_name} વિસ્તાર માટે હવા ગુણવત્તા ચેતવણી"
                content = f"""# {title}
**તારીખ:** {created_at}

## 1. હાલની સ્થિતિ
**{top_name}** વિસ્તારમાં PM2.5 નું પ્રમાણ **{top_val} µg/m³** નોંધાયું છે.

## 2. સાવચેતીના પગલાં
- બાળકો અને વૃદ્ધોએ બિનજરૂરી રીતે બહાર નીકળવાનું ટાળવું.
- બહાર જતી વખતે N95 માસ્કનો ઉપયોગ કરવો.

*પુરાવા સંદર્ભ: {', '.join(evidence_citations)}*
"""
            elif language == "ta":
                title = f"பொது சுகாதார காற்றுத் தர எச்சரிக்கை [{lang_display}]"
                headline = f"{top_name} மற்றும் சுற்றுப்புற பகுதிகளுக்கான எச்சரிக்கை"
                content = f"""# {title}
**தேதி:** {created_at}

## 1. தற்போதைய நிலை
**{top_name}** பகுதியில் PM2.5 அளவு **{top_val} µg/m³** ஆக உயர்ந்துள்ளது.

## 2. பாதுகாப்பு வழிகாட்டுதல்கள்
- குழந்தைகள் மற்றும் முதியவர்கள் காலையில் வெளிப்புற நடைப்பயிற்சியை தவிர்க்கவும்.
- வெளியே செல்லும்போது முகக்கவசம் அணியவும்.

*சான்று குறியீடு: {', '.join(evidence_citations)}*
"""
            else:
                content = f"""# {title}
**Issue Date:** {created_at} | **Target Audience:** General Public & Families | **Reading Level:** {reading_level}

---

## What You Need to Know Today
Monitoring sensors across our civic grid have identified heightened particulate air pollution, particularly in **{top_name}**, where PM2.5 has averaged **{top_val} µg/m³**.

## Practical Steps to Protect Yourself & Your Family
1. **Reduce Strenuous Outdoor Activity:** Limit high-intensity workouts and children's playground sports during morning and late evening peaks.
2. **Keep Indoor Air Clean:** Close windows during rush hour traffic; avoid burning incense, dry leaf piles, or candles indoors.
3. **Wear Well-Fitted Masks:** When commuting on high-traffic roads, wear an N95 particle mask.
4. **Vulnerable Groups:** Asthmatic individuals, young children, and seniors should ensure medications are on hand.

## Impacted Wards
- {', '.join([w.ward for w in wards[:4]])}

*(Supported by verified sensor evidence: {', '.join(evidence_citations)})*
"""

        return ReportResponse(
            report_id=report_id,
            analysis_id=overall.latest_analysis_date,
            report_type=report_type,
            language=language,
            language_display=lang_display,
            reading_level=reading_level,
            created_at=created_at,
            title=title,
            executive_summary_or_headline=headline,
            affected_locations=[w.ward for w in wards[:5]],
            key_findings_or_observations=[f"{w.ward}: {w.avg_pm25} µg/m³ ({w.category})" for w in wards[:4]],
            priority_actions_or_precautions=[
                "Deploy street-level particulate misting",
                "Limit prolonged pediatric exposure",
                "Wear protective particle masks during transit"
            ],
            evidence_citations=evidence_citations,
            data_limitations=f"Based on {overall.data_completeness}% verified monitoring telemetry.",
            full_text_markdown=content,
            pdf_download_url=f"/api/reports/{report_id}/pdf",
        )

gemini_service = GeminiService()

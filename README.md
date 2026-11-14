# AIRGUARD AI
### Understand the Air. Protect Your Community.
**AI-Powered Civic Intelligence & Environmental Intervention Platform**

AirGuard AI transforms messy, fragmented municipal air quality datasets into auditable, evidence-backed local interventions for **Municipal Officers**, **Housing Society Administrators**, and **School Administrators**.

---

## 🌟 Key Capabilities

- **Intelligent Messy Data Engine:** Ingests CSV, XLSX, JSON, and pasted tables. Auto-detects column variations (`PM25`, `PM_2_5`, `particulate_25`, `Ward`, `Station_Name`), normalizes dates to ISO 8601, and standardizes units (e.g. `mg/m³` to `µg/m³`).
- **Deterministic Validation & Audit:** Flags missing readings, duplicate bursts, and sensor anomalies (negative values, extreme spikes) without silent data fabrication or deletion.
- **Explainable AI & Evidence Traceability:** Every quantitative AI conclusion links to an immutable **Evidence ID** displaying the source filename, raw row number, baseline values, and exact calculation formula.
- **Role-Based Action Planner:** Deterministically scored action frameworks customized for:
  - 🏛️ **Municipal Officers:** Anti-smog mist sprayers, construction halts, diesel diversions.
  - 🏢 **Housing Societies:** Dry broom bans, HVAC HEPA recirculation, senior advisories.
  - 🏫 **School Administrators:** Outdoor sports suspension, bus cabin seals, infirmary readiness.
- **Interactive Hotspot Spatial Map:** OpenStreetMap and Leaflet spatial visualization with color-coded severity radii and strict GIS integrity rules (never invents coordinates).
- **Multilingual Briefing Studio:** Generates official government directives and citizen advisories in **5 languages** (English, Hindi, Marathi, Gujarati, Tamil) across 3 reading levels with **1-click ReportLab PDF export**.
- **Ask AirGuard Conversational AI:** Dataset-grounded assistant that answers civic questions and cites audit telemetry without hallucinations.
- **Historical Comparison:** Period-over-period tracking of worsening locations, improving sectors, and persistent hotspots.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts, Leaflet |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, Pandas, NumPy, ReportLab, Uvicorn |
| **AI Integration** | Google Gemini API (`google-genai`), Structured JSON, Deterministic Fallback Engine |
| **Database & Storage** | Supabase PostgreSQL Schema with RLS, Local In-Memory & File Audit Cache |
| **Testing** | Pytest, Next.js Production Build Validation, Live Endpoint Probing |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be available at: `http://localhost:8000` (Docs: `http://localhost:8000/docs`)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm start
```
Frontend application will be available at: `http://localhost:3000`

### 4. Running with Docker Compose
```bash
docker-compose up --build
```

---

## 🧪 Automated Testing

Run the automated backend test suite:
```bash
python -m pytest backend/tests/test_backend.py -v
```
All 7 tests verify:
- System health and integration readiness
- One-click messy demo loading and cleaning
- Deterministic statistical and ward rankings calculation
- Role action recommendation scoring
- Grounded conversational assistant queries
- Multilingual report synthesis & ReportLab PDF compilation
- Historical comparison delta analysis

---

## 📂 Project Structure

```
AirGuard-AI/
├── frontend/                     # Next.js App Router Frontend
│   ├── app/                      # 11 Application Pages
│   │   ├── page.tsx              # Landing Page
│   │   ├── dashboard/page.tsx    # Overview Dashboard
│   │   ├── upload/page.tsx       # Intelligent Upload Center
│   │   ├── analysis/page.tsx     # AI Analysis & Evidence
│   │   ├── map/page.tsx          # Pollution Hotspot Map
│   │   ├── assistant/page.tsx    # Ask AirGuard AI Assistant
│   │   ├── planner/page.tsx      # Role-Based Action Planner
│   │   ├── briefing/page.tsx     # Multilingual Briefing Studio
│   │   ├── comparison/page.tsx   # Historical Comparison
│   │   ├── quality/page.tsx      # Data Quality Center
│   │   └── settings/page.tsx     # Settings & Integrations
│   ├── components/               # Navbar, Sidebar, EvidenceModal, LeafletMap
│   ├── services/                 # API Client
│   └── lib/                      # Design system utilities
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── api/routes.py         # Full REST API endpoints
│   │   ├── core/config.py        # Settings & environment
│   │   ├── models/               # Supabase schema & repository
│   │   ├── schemas/              # Pydantic schemas
│   │   └── services/             # Cleaners, Statistics, Evidence, Gemini, PDF
│   ├── tests/                    # Pytest test suite
│   └── requirements.txt
├── sample-data/                  # Synthetic Messy Datasets (CSV, XLSX, JSON)
├── docs/                         # Architecture, API & Deployment guides
├── docker-compose.yml
└── README.md
```

---

## 🔒 Security & Reliability Guarantee

- **Zero Silent Fabrication:** Missing particulate values are identified and quantified in completeness scores rather than hallucinated.
- **Segregated Anomaly Logs:** Spikes and baseline negatives are segregated into the Data Quality Center for audit review.
- **Fail-Safe Offline Mode:** If Gemini API keys are omitted, AirGuard AI automatically operates using its deterministic mathematical intelligence engine.

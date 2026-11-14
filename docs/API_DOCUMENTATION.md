# AirGuard AI: API Reference Documentation

All endpoints are served under `/api` and return standardized JSON responses.

### 1. System Health
- **`GET /api/health`**
  - Returns service status, Gemini integration status, and active database mode.

### 2. Dataset Ingestion & Validation
- **`POST /api/datasets/upload`**
  - Accepts multipart `file` (CSV, XLSX, JSON) or `pasted_data`.
  - Returns detected columns, suggested schema mapping, and preview rows.
- **`POST /api/datasets/{dataset_id}/validate`**
  - Validates confirmed column mappings.
  - Cleans, normalizes units (e.g. mg/m³ to µg/m³), isolates suspicious readings, and generates Data Quality Summary (0-100 score and letter grade).
- **`GET /api/datasets`**
  - Lists all uploaded datasets with metadata.
- **`GET /api/datasets/{dataset_id}`**
  - Returns dataset metadata and sample rows.

### 3. Analysis & Intelligence
- **`POST /api/analysis/generate?dataset_id={id}`**
  - Executes deterministic statistical engine, trend calculation, and calls Gemini AI (or fallback engine).
  - Populates immutable Evidence Registry.
- **`GET /api/analysis/{analysis_id}`**
  - Retrieves analysis result (or pass `latest` for the most recent run).

### 4. Role Action Directives
- **`POST /api/actions/generate`**
  - Body: `{"analysis_id": "...", "role": "municipal_officer" | "housing_society" | "school_administrator"}`
  - Returns prioritized interventions with deterministic scoring (0-100), timeframes, and evidence IDs.

### 5. Conversational Assistant
- **`POST /api/assistant/chat`**
  - Body: `{"analysis_id": "...", "message": "...", "history": [...]}`
  - Returns factual answers strictly grounded in dataset telemetry, cited evidence IDs, and follow-up prompts.

### 6. Briefings & PDF Export
- **`POST /api/reports/generate`**
  - Body: `{"analysis_id": "...", "report_type": "government_briefing" | "citizen_advisory", "language": "en"|"hi"|"mr"|"gu"|"ta", "reading_level": "Simple"|"Standard"|"Professional"}`
- **`GET /api/reports/{report_id}/pdf`**
  - Returns binary PDF compiled with ReportLab, including data tables, directives, and signatures.

### 7. Historical Comparison
- **`POST /api/reports/compare`**
  - Body: `{"current_analysis_id": "latest"}`
  - Returns worsening locations, improving locations, persistent hotspots, and completeness delta.

### 8. One-Click Quickstart
- **`POST /api/demo/load`**
  - Ingests messy synthetic simulation dataset, runs cleaning, validation, and analysis in a single call.

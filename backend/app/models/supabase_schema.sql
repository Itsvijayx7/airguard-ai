-- Supabase PostgreSQL Schema for AIRGUARD AI
-- Includes Row Level Security (RLS) policies and relational constraints

-- 1. Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'municipal_officer' CHECK (role IN ('municipal_officer', 'housing_society', 'school_administrator')),
    organization TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Datasets Table
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    detected_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
    column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_quality JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_demo_data BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Monitoring Stations
CREATE TABLE IF NOT EXISTS public.monitoring_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ward TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Measurements
CREATE TABLE IF NOT EXISTS public.measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    ward TEXT NOT NULL,
    station_name TEXT,
    reading_timestamp TIMESTAMPTZ NOT NULL,
    pm25 DOUBLE PRECISION,
    pm10 DOUBLE PRECISION,
    unit TEXT NOT NULL DEFAULT 'ug/m3',
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    suspicion_reason TEXT,
    original_row_index INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Analysis Runs
CREATE TABLE IF NOT EXISTS public.analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    overall_stats JSONB NOT NULL,
    ward_rankings JSONB NOT NULL,
    historical_trends JSONB NOT NULL,
    ai_insights JSONB NOT NULL,
    evidence_registry JSONB NOT NULL,
    data_limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_engine TEXT NOT NULL DEFAULT 'Gemini 3.5 Flash',
    is_demo_mode BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Role Recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    action_title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL,
    priority_score INT NOT NULL,
    target_wards JSONB NOT NULL,
    reason TEXT NOT NULL,
    evidence_ids JSONB NOT NULL,
    intended_audience TEXT NOT NULL,
    suggested_timeframe TEXT NOT NULL,
    data_limitations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Reports & Advisories
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    reading_level TEXT NOT NULL DEFAULT 'Standard',
    title TEXT NOT NULL,
    headline_or_summary TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    evidence_citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Chat Sessions & Messages
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    evidence_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policies
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow authenticated read datasets" ON public.datasets FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert datasets" ON public.datasets FOR INSERT WITH CHECK (true);

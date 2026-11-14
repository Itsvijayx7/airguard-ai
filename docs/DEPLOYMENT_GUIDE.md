# AirGuard AI: Deployment & Production Setup Guide

## 1. Quickstart with Docker Compose
Run both backend and frontend in isolated containers:
```bash
docker-compose up --build
```
- Frontend available at: `http://localhost:3000`
- Backend Swagger API at: `http://localhost:8000/docs`

---

## 2. Local Manual Deployment

### A. Backend Setup (FastAPI & Python 3.13)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### B. Frontend Setup (Next.js 14)
```bash
cd frontend
npm install
npm run build
npm start
```

---

## 3. Production Cloud Deployment

### Frontend (Vercel)
1. Push repository to GitHub.
2. In Vercel, set root directory to `frontend`.
3. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL (e.g. `https://airguard-api.onrender.com/api`).
4. Deploy.

### Backend (Render / Railway)
1. Connect GitHub repository.
2. Set root directory to `backend`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set Environment Variables:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `SUPABASE_URL`: (Optional) Your Supabase project URL.
   - `SUPABASE_KEY`: (Optional) Your Supabase anon/service key.

### Database (Supabase PostgreSQL)
1. In Supabase Dashboard, open SQL Editor.
2. Run the provided migration file: `backend/app/models/supabase_schema.sql`.
3. Copy the Project URL and anon key into your backend `.env`.

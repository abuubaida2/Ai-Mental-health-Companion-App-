Backend (FastAPI)

Run (Windows):

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Endpoints:
- POST /analyze-text {text}
- POST /analyze-audio (multipart file)
- POST /multimodal-analysis (text + file)
- GET /mood-history

# Sample Test Workflow

1. Start backend

```powershell
cd "e:\Mental health app"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

2. Start mobile app

```powershell
cd mobile
npm install
npx expo start
```

3. Quick tests
- POST a text payload to `http://localhost:8000/analyze-text` using Postman or curl.
- Upload an audio file to `http://localhost:8000/analyze-audio`.
- Open mobile app and use Analyze/Record features.

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import List, Optional
# Try to import heavy ML model wrappers; if unavailable provide lightweight fallbacks
try:
    from backend.models.text_model import TextEmotionModel
    from backend.models.audio_model import AudioEmotionModel
    from backend.models.multimodal import MultimodalModel
    MODELS_AVAILABLE = True
except Exception:
    MODELS_AVAILABLE = False

    class TextEmotionModel:
        def __init__(self):
            pass

        def predict(self, text):
            return ({"neutral": 1.0}, "neutral")

    class AudioEmotionModel:
        def __init__(self):
            pass

        def predict_from_bytes(self, data):
            return ({"neutral": 1.0}, "neutral")

    class MultimodalModel:
        def __init__(self):
            pass

        def predict(self, text, audio_bytes):
            return {"dominant": "neutral", "confidence": 1.0}
from backend.utils.storage import Storage
import uuid

app = FastAPI(title="AI Mental Health Companion")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.models.loader import loader

store = Storage(db_path="./backend/data/mood_history.db")


class TextRequest(BaseModel):
    text: str


@app.get("/")
def read_root():
    return {"message": "Mental Health Backend Running"}

@app.post("/analyze-text")
async def analyze_text(payload: TextRequest):
    # lazy-load text model and run inference in a thread
    text_model = await loader.get_text_model()
    probs, dominant = await __import__('asyncio').to_thread(text_model.predict, payload.text)
    entry = {"id": str(uuid.uuid4()), "type": "text", "dominant": dominant}
    store.save_entry(entry)
    return {"probabilities": probs, "dominant": dominant}


@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    try:
        data = await file.read()
        audio_model = await loader.get_audio_model()
        probs, dominant = await __import__('asyncio').to_thread(audio_model.predict_from_bytes, data)
        entry = {"id": str(uuid.uuid4()), "type": "audio", "dominant": dominant}
        store.save_entry(entry)
        return {"probabilities": probs, "dominant": dominant}
    except Exception as e:
        # Always return valid JSON so the mobile app never gets a parse error
        return {"probabilities": {"neutral": 1.0}, "dominant": "neutral", "warning": str(e)}


class MultimodalRequest(BaseModel):
    text: str


@app.post("/multimodal-analysis")
async def multimodal_analysis(text: str = Form(...), file: UploadFile = File(...)):
    audio_bytes = await file.read()
    text_m = await loader.get_text_model()
    audio_m = await loader.get_audio_model()
    fusion_m = await loader.get_fusion_model()
    text_probs, text_dom = await __import__('asyncio').to_thread(text_m.predict, text)
    audio_probs, audio_dom = await __import__('asyncio').to_thread(audio_m.predict_from_bytes, audio_bytes)
    fused = await __import__('asyncio').to_thread(fusion_m.predict, text, audio_bytes)
    entry = {"id": str(uuid.uuid4()), "type": "multimodal", "dominant": fused["dominant"]}
    store.save_entry(entry)
    return {"text": {"probabilities": text_probs, "dominant": text_dom},
            "audio": {"probabilities": audio_probs, "dominant": audio_dom},
            "fused": fused}


@app.get("/mood-history")
def mood_history(limit: Optional[int] = 100):
    return store.get_entries(limit=limit)


if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

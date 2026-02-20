import asyncio
from typing import Optional


class ModelLoader:
    def __init__(self):
        self._text = None
        self._audio = None
        self._fusion = None
        self._text_lock = asyncio.Lock()
        self._audio_lock = asyncio.Lock()
        self._fusion_lock = asyncio.Lock()

    async def get_text_model(self):
        if self._text is None:
            async with self._text_lock:
                if self._text is None:
                    # import and initialize in a thread to avoid blocking
                    from backend.models.text_model import TextEmotionModel
                    self._text = await asyncio.to_thread(TextEmotionModel)
        return self._text

    async def get_audio_model(self):
        if self._audio is None:
            async with self._audio_lock:
                if self._audio is None:
                    from backend.models.audio_model import AudioEmotionModel
                    self._audio = await asyncio.to_thread(AudioEmotionModel)
        return self._audio

    async def get_fusion_model(self):
        if self._fusion is None:
            async with self._fusion_lock:
                if self._fusion is None:
                    from backend.models.multimodal import MultimodalModel
                    self._fusion = await asyncio.to_thread(MultimodalModel)
        return self._fusion


loader = ModelLoader()

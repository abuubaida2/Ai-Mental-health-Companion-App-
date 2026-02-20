import typing

# GoEmotions dataset labels (28 emotions)
LABELS = [
    "admiration", "amusement", "anger", "annoyance", "approval",
    "caring", "confusion", "curiosity", "desire", "disappointment",
    "disapproval", "disgust", "embarrassment", "excitement", "fear",
    "gratitude", "grief", "joy", "love", "nervousness",
    "optimism", "pride", "realization", "relief", "remorse",
    "sadness", "surprise", "neutral"
]


class TextEmotionModel:
    """Lazy-loading Text model wrapper. Heavy imports occur during initialization."""
    def __init__(self, model_name: str = "distilbert-base-uncased"):
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.available = False
        try:
            # import heavy libs only when instantiating
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch
            self.torch = torch
            self.AutoTokenizer = AutoTokenizer
            self.AutoModelForSequenceClassification = AutoModelForSequenceClassification
            # load tokenizer and model (may download if not cached)
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            try:
                self.model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=len(LABELS))
            except Exception:
                self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
            self.available = True
        except Exception:
            # transformers or torch not available in environment
            self.available = False

    def predict(self, text: str) -> typing.Tuple[typing.Dict[str, float], str]:
        if not self.available:
            return ({"neutral": 1.0}, "neutral")
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        with self.torch.no_grad():
            outputs = self.model(**inputs)
            if hasattr(outputs, "logits"):
                logits = outputs.logits
            else:
                logits = outputs[0]
            probs = self.torch.sigmoid(logits).squeeze().cpu().numpy()
        probs = probs.tolist()
        if len(probs) != len(LABELS):
            import numpy as np
            import torch as _torch
            arr = np.array(logits.squeeze().cpu())
            sp = _torch.nn.functional.softmax(_torch.tensor(arr), dim=0).numpy()
            probs = sp.tolist()
        mapping = {LABELS[i]: float(probs[i]) for i in range(min(len(LABELS), len(probs)))}
        dominant = max(mapping.items(), key=lambda x: x[1])[0]
        return mapping, dominant

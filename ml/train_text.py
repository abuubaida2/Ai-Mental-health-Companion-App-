"""
Fine-tune DistilBERT on GoEmotions (multi-label).
Run with a GPU-enabled environment. This script uses HuggingFace Trainer.
"""
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from datasets import load_from_disk
import numpy as np
import os


def compute_metrics(p):
    preds = (p.predictions > 0).astype(int) if p.predictions.ndim==3 else (p.predictions>0.5).astype(int)
    labels = p.label_ids
    # placeholder metrics -- expand with sklearn
    return {}


def train(data_dir="ml/data/goemotions", model_name="distilbert-base-uncased", output_dir="ml/models/text_model"):
    ds = load_from_disk(data_dir)
    tokenizer = AutoTokenizer.from_pretrained(model_name)

    def preprocess(ex):
        return tokenizer(ex["text"], truncation=True, padding=True)

    tokenized = ds.map(preprocess, batched=True)
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=28)
    args = TrainingArguments(output_dir=output_dir, per_device_train_batch_size=8, num_train_epochs=3, logging_steps=50)
    trainer = Trainer(model=model, args=args, train_dataset=tokenized["train"], eval_dataset=tokenized["validation"], compute_metrics=compute_metrics)
    trainer.train()
    trainer.save_model(output_dir)


if __name__ == "__main__":
    train()

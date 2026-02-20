"""
Full training script for text emotion model (GoEmotions) using HuggingFace.

Usage:
  python ml/train_text_full.py --output_dir ml/models/text_model --model_name distilbert-base-uncased

This script downloads GoEmotions, preprocesses for multi-label classification,
and fine-tunes a transformer with Trainer. It saves the model and prints metrics.
"""
import os
import argparse
from datasets import load_dataset
from transformers import (AutoTokenizer, AutoModelForSequenceClassification,
                          TrainingArguments, Trainer, DataCollatorWithPadding)
import numpy as np
from sklearn.metrics import precision_recall_fscore_support, accuracy_score


def compute_metrics(pred):
    preds = pred.predictions
    if preds.ndim == 2:
        probs = 1 / (1 + np.exp(-preds))
    else:
        probs = preds
    y_pred = (probs >= 0.5).astype(int)
    y_true = pred.label_ids
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='micro', zero_division=0)
    acc = accuracy_score(y_true, y_pred)
    return {"accuracy": float(acc), "precision_micro": float(precision), "recall_micro": float(recall), "f1_micro": float(f1)}


def preprocess_labels(example, label_list):
    vec = [0] * len(label_list)
    for l in example.get('labels', []):
        if l is not None and 0 <= l < len(label_list):
            vec[l] = 1
    example['multi_label'] = vec
    return example


def train(model_name: str, output_dir: str, epochs: int = 3, batch_size: int = 8):
    print('Loading GoEmotions dataset...')
    ds = load_dataset('go_emotions')
    label_list = ds['train'].features['labels'].feature.names
    print('Labels:', label_list)
    os.makedirs(output_dir, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(model_name)

    def tokenize_fn(batch):
        return tokenizer(batch['text'], truncation=True, padding='max_length', max_length=128)

    ds = ds.map(lambda ex: preprocess_labels(ex, label_list), batched=False)
    ds = ds.map(tokenize_fn, batched=True, remove_columns=['text', 'labels', 'id'])
    ds = ds.rename_column('multi_label', 'labels')

    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=len(label_list))

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    args = TrainingArguments(
        output_dir=output_dir,
        evaluation_strategy='epoch',
        save_strategy='epoch',
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        num_train_epochs=epochs,
        logging_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model='f1_micro'
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=ds['train'],
        eval_dataset=ds['validation'],
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    trainer.train()
    trainer.save_model(output_dir)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_name', default='distilbert-base-uncased')
    parser.add_argument('--output_dir', default='ml/models/text_model')
    parser.add_argument('--epochs', default=3, type=int)
    parser.add_argument('--batch_size', default=8, type=int)
    args = parser.parse_args()
    train(args.model_name, args.output_dir, epochs=args.epochs, batch_size=args.batch_size)

"""
Evaluate a trained text model saved by `train_text_full.py` on the GoEmotions test set.
Generates metrics and a per-label report.
"""
import argparse
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import numpy as np
from sklearn.metrics import classification_report, precision_recall_fscore_support


def evaluate(model_dir):
    ds = load_dataset('go_emotions')
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)

    def preprocess(batch):
        return tokenizer(batch['text'], truncation=True, padding=True)

    tokenized = ds['test'].map(preprocess, batched=True, remove_columns=['text','labels','id'])
    inputs = {k:tokenized[k] for k in tokenized.column_names if k in ['input_ids','attention_mask']}

    preds = model(**{k: np.array(v) for k,v in inputs.items()})
    logits = preds.logits
    probs = 1 / (1 + np.exp(-logits))
    y_pred = (probs >= 0.5).astype(int)
    y_true = np.vstack(tokenized['labels'])

    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='micro', zero_division=0)
    print(f'Micro precision: {precision:.4f}, recall: {recall:.4f}, f1: {f1:.4f}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_dir', default='ml/models/text_model')
    args = parser.parse_args()
    evaluate(args.model_dir)

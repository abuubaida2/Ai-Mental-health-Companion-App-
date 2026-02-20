"""
Download and prepare GoEmotions dataset for HuggingFace Trainer.
Run: python ml/prepare_goemotions.py
"""
from datasets import load_dataset
import os


def prepare(output_dir="ml/data/goemotions"):
    os.makedirs(output_dir, exist_ok=True)
    ds = load_dataset("go_emotions")
    # Save locally for reproducibility
    ds.save_to_disk(output_dir)


if __name__ == "__main__":
    prepare()

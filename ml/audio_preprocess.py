"""
Audio preprocessing utilities: extract MFCCs and save per-utterance .npy files.

Expected usage:
  python ml/audio_preprocess.py --input_dir path/to/raw_wavs --output_dir ml/audio_features

This script is a convenience helper; RAVDESS/CREMA-D dataset organization varies, so
you may need to adapt the file discovery logic.
"""
import os
import argparse
import librosa
import numpy as np


def process_file(path, sr=16000, n_mfcc=40):
    y, _ = librosa.load(path, sr=sr)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    mfcc = (mfcc - np.mean(mfcc)) / (np.std(mfcc) + 1e-6)
    return mfcc


def scan_and_save(input_dir, output_dir, sr=16000, n_mfcc=40):
    os.makedirs(output_dir, exist_ok=True)
    files = []
    for root, _, fnames in os.walk(input_dir):
        for f in fnames:
            if f.lower().endswith('.wav'):
                files.append(os.path.join(root, f))
    print(f'Found {len(files)} wav files')
    for p in files:
        try:
            mfcc = process_file(p, sr=sr, n_mfcc=n_mfcc)
            basename = os.path.splitext(os.path.basename(p))[0]
            outp = os.path.join(output_dir, basename + '.npy')
            np.save(outp, mfcc)
        except Exception as e:
            print('Failed', p, e)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input_dir', required=True)
    parser.add_argument('--output_dir', default='ml/audio_features')
    parser.add_argument('--sr', default=16000, type=int)
    parser.add_argument('--n_mfcc', default=40, type=int)
    args = parser.parse_args()
    scan_and_save(args.input_dir, args.output_dir, sr=args.sr, n_mfcc=args.n_mfcc)

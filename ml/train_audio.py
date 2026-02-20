"""
Train audio CNN+LSTM model on RAVDESS/CREMA-D.
This is a template; data loading and augmentation should be implemented per dataset.
"""
import torch
from torch import nn
from torch.utils.data import Dataset, DataLoader
import os
import numpy as np


import os
import glob
import argparse
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from torch import nn, optim
import matplotlib.pyplot as plt


class MFCCDataset(Dataset):
    def __init__(self, files, labels):
        self.files = files
        self.labels = labels

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        arr = np.load(self.files[idx])
        # arr shape: (n_mfcc, time)
        return torch.tensor(arr, dtype=torch.float32), torch.tensor(self.labels[idx], dtype=torch.long)


class SimpleAudioNet(nn.Module):
    def __init__(self, n_mfcc=40, hidden=64, num_classes=8):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(n_mfcc, hidden, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(32),
        )
        self.lstm = nn.LSTM(32, hidden, batch_first=True)
        self.fc = nn.Linear(hidden, num_classes)

    def forward(self, x):
        c = self.conv(x)
        c = c.permute(0, 2, 1)
        out, _ = self.lstm(c)
        out = out[:, -1, :]
        return self.fc(out)


def load_feature_paths_and_labels(feature_dir):
    # Expect feature files as .npy and labels encoded in filenames or a sidecar CSV.
    # For demo, this will assign dummy labels (0) to all files. Replace with dataset parsing.
    files = glob.glob(os.path.join(feature_dir, '*.npy'))
    labels = [0] * len(files)
    return files, labels


def train(feature_dir, output_dir, epochs=10, batch_size=32, lr=1e-3, num_classes=8):
    os.makedirs(output_dir, exist_ok=True)
    files, labels = load_feature_paths_and_labels(feature_dir)
    ds = MFCCDataset(files, labels)
    dl = DataLoader(ds, batch_size=batch_size, shuffle=True, num_workers=0)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = SimpleAudioNet(num_classes=num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    opt = optim.Adam(model.parameters(), lr=lr)

    losses = []
    for ep in range(epochs):
        model.train()
        running = 0.0
        for xb, yb in dl:
            xb, yb = xb.to(device), yb.to(device)
            # ensure shape (batch, n_mfcc, time)
            if xb.dim() == 2:
                xb = xb.unsqueeze(0)
            opt.zero_grad()
            logits = model(xb)
            loss = criterion(logits, yb)
            loss.backward()
            opt.step()
            running += loss.item()
        avg = running / len(dl)
        print(f'Epoch {ep+1}/{epochs} loss={avg:.4f}')
        losses.append(avg)

    torch.save(model.state_dict(), os.path.join(output_dir, 'audio_model.pt'))
    plt.plot(losses)
    plt.xlabel('epoch')
    plt.ylabel('loss')
    plt.savefig(os.path.join(output_dir, 'train_loss.png'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--feature_dir', default='ml/audio_features')
    parser.add_argument('--output_dir', default='ml/models/audio_model')
    parser.add_argument('--epochs', default=10, type=int)
    parser.add_argument('--batch_size', default=32, type=int)
    parser.add_argument('--lr', default=1e-3, type=float)
    args = parser.parse_args()
    train(args.feature_dir, args.output_dir, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)

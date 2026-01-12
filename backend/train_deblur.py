"""Train a lightweight deblurring / enhancement model on the blurred_sharp dataset.

Usage (from backend/):

    python train_deblur.py \
        --data-root ../blurred_sharp/blurred_sharp \
        --epochs 10 \
        --batch-size 8 \
        --img-size 256

This will save weights under runs/deblur/deblur_unet.pt which the
DeblurModel wrapper will automatically load.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

from deblur_model import DeblurUNet


class BlurredSharpDataset(Dataset):
    def __init__(self, root: str, img_size: int = 256):
        self.root = Path(root)
        self.blurred_dir = self.root / "blurred"
        self.sharp_dir = self.root / "sharp"
        self.img_size = img_size

        if not self.blurred_dir.exists() or not self.sharp_dir.exists():
            raise FileNotFoundError(f"Expected blurred/ and sharp/ under {self.root}")

        # Expect identical filenames in both folders
        blurred_files = sorted([p.name for p in self.blurred_dir.glob("*.png")])
        sharp_files = sorted([p.name for p in self.sharp_dir.glob("*.png")])
        self.filenames = [f for f in blurred_files if f in set(sharp_files)]
        if not self.filenames:
            raise RuntimeError("No matching image pairs found in blurred/ and sharp/.")

    def __len__(self) -> int:  # type: ignore[override]
        return len(self.filenames)

    def _load_image(self, path: Path) -> np.ndarray:
        img = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if img is None:
            raise RuntimeError(f"Failed to read image: {path}")
        img = cv2.resize(img, (self.img_size, self.img_size), interpolation=cv2.INTER_AREA)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.astype("float32") / 255.0
        return img

    def __getitem__(self, idx: int):  # type: ignore[override]
        name = self.filenames[idx]
        blurred = self._load_image(self.blurred_dir / name)
        sharp = self._load_image(self.sharp_dir / name)

        # HWC -> CHW
        blurred_t = torch.from_numpy(blurred).permute(2, 0, 1)
        sharp_t = torch.from_numpy(sharp).permute(2, 0, 1)
        return blurred_t, sharp_t


def train(args: argparse.Namespace) -> None:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    dataset = BlurredSharpDataset(args.data_root, img_size=args.img_size)
    dataloader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True, num_workers=2)

    model = DeblurUNet().to(device)
    criterion = nn.L1Loss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)

    runs_dir = Path("runs") / "deblur"
    runs_dir.mkdir(parents=True, exist_ok=True)
    weights_path = runs_dir / "deblur_unet.pt"

    global_step = 0
    for epoch in range(args.epochs):
        model.train()
        epoch_loss = 0.0
        for blurred, sharp in dataloader:
            blurred = blurred.to(device)
            sharp = sharp.to(device)

            optimizer.zero_grad()
            out = model(blurred)
            loss = criterion(out, sharp)
            loss.backward()
            optimizer.step()

            batch_loss = float(loss.item())
            epoch_loss += batch_loss
            global_step += 1

            if global_step % 50 == 0:
                print(f"Epoch {epoch+1}/{args.epochs}, step {global_step}, batch loss: {batch_loss:.4f}")

        epoch_loss /= max(1, len(dataloader))
        print(f"Epoch {epoch+1} finished, avg loss: {epoch_loss:.4f}")

        # Save checkpoint each epoch
        torch.save(model.state_dict(), weights_path)
        print(f"Saved weights to {weights_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train deblurring model on blurred_sharp dataset")
    parser.add_argument("--data-root", type=str, default="../blurred_sharp/blurred_sharp")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--img-size", type=int, default=256)
    parser.add_argument("--lr", type=float, default=1e-4)
    return parser.parse_args()


if __name__ == "__main__":
    train(parse_args())

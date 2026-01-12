"""Offline motion blur + low-light augmentation for YOLO-style datasets.

This script duplicates images in a dataset's train/images folder with
blurred and darkened variants while copying labels 1:1. It is generic and
can be used for both damage and OCR datasets.

Example usage (from backend/):

    # Augment Wagon damage dataset
    python augment_motion_blur.py --dataset-root ../data/WagonDamageDetection-3

    # Augment wagon number OCR dataset
    python augment_motion_blur.py --dataset-root ../data/wagon_number-1
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

import cv2
import numpy as np


def apply_motion_blur(image: np.ndarray, kernel_size: int = 15, angle: float = 0.0) -> np.ndarray:
  """Apply simple linear motion blur kernel at given angle."""
  kernel = np.zeros((kernel_size, kernel_size), dtype=np.float32)
  kernel[kernel_size // 2, :] = 1.0
  kernel /= kernel_size

  # Rotation matrix around center
  center = (kernel_size / 2 - 0.5, kernel_size / 2 - 0.5)
  rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
  kernel = cv2.warpAffine(kernel, rot_mat, (kernel_size, kernel_size))

  return cv2.filter2D(image, -1, kernel)


def apply_low_light(image: np.ndarray, factor: float = 0.4) -> np.ndarray:
  """Darken and slightly noise an image to emulate low light."""
  img = image.astype(np.float32) / 255.0
  img *= factor
  noise = np.random.normal(0, 0.02, img.shape).astype(np.float32)
  img = np.clip(img + noise, 0.0, 1.0)
  return (img * 255.0).astype(np.uint8)


def augment_dataset(dataset_root: Path, blur_only: bool = False) -> None:
  images_dir = dataset_root / "train" / "images"
  labels_dir = dataset_root / "train" / "labels"

  if not images_dir.exists() or not labels_dir.exists():
    raise FileNotFoundError(
      f"Expected YOLO train/images and train/labels under {dataset_root}, "
      "but they were not found."
    )

  image_paths = sorted(list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png")))
  print(f"Found {len(image_paths)} training images under {images_dir}")

  for img_path in image_paths:
    label_path = labels_dir / (img_path.stem + ".txt")
    if not label_path.exists():
      continue

    img = cv2.imread(str(img_path), cv2.IMREAD_COLOR)
    if img is None:
      continue

    # 1) Motion-blurred version
    angle = float(np.random.uniform(-20, 20))
    ksize = int(np.random.choice([9, 13, 17, 21]))
    blurred = apply_motion_blur(img, kernel_size=ksize, angle=angle)
    out_blur_path = images_dir / f"{img_path.stem}_blur.jpg"
    cv2.imwrite(str(out_blur_path), blurred)
    shutil.copy2(label_path, labels_dir / f"{img_path.stem}_blur.txt")

    if blur_only:
      continue

    # 2) Motion-blur + low-light
    dark_blurred = apply_low_light(blurred, factor=float(np.random.uniform(0.25, 0.6)))
    out_dark_path = images_dir / f"{img_path.stem}_blur_dark.jpg"
    cv2.imwrite(str(out_dark_path), dark_blurred)
    shutil.copy2(label_path, labels_dir / f"{img_path.stem}_blur_dark.txt")

  print("Augmentation complete.")


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Add motion blur + low light augmentations to YOLO dataset")
  parser.add_argument("--dataset-root", type=str, required=True, help="Path to dataset root (contains data.yaml)")
  parser.add_argument("--blur-only", action="store_true", help="Only add blurred copies, skip dark + blur")
  return parser.parse_args()


if __name__ == "__main__":
  args = parse_args()
  augment_dataset(Path(args.dataset_root), blur_only=args.blur_only)

import os
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn as nn


class DeblurUNet(nn.Module):
    """A lightweight U-Net style model for image deblurring / enhancement.

    This is intentionally small so it can run in real-time on edge devices.
    """

    def __init__(self, in_channels: int = 3, base_channels: int = 32):
        super().__init__()

        self.enc1 = nn.Sequential(
            nn.Conv2d(in_channels, base_channels, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_channels, base_channels, 3, padding=1),
            nn.ReLU(inplace=True),
        )
        self.pool1 = nn.MaxPool2d(2)

        self.enc2 = nn.Sequential(
            nn.Conv2d(base_channels, base_channels * 2, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_channels * 2, base_channels * 2, 3, padding=1),
            nn.ReLU(inplace=True),
        )
        self.pool2 = nn.MaxPool2d(2)

        self.bottleneck = nn.Sequential(
            nn.Conv2d(base_channels * 2, base_channels * 4, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_channels * 4, base_channels * 4, 3, padding=1),
            nn.ReLU(inplace=True),
        )

        self.up2 = nn.ConvTranspose2d(base_channels * 4, base_channels * 2, 2, stride=2)
        self.dec2 = nn.Sequential(
            nn.Conv2d(base_channels * 4, base_channels * 2, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_channels * 2, base_channels * 2, 3, padding=1),
            nn.ReLU(inplace=True),
        )

        self.up1 = nn.ConvTranspose2d(base_channels * 2, base_channels, 2, stride=2)
        self.dec1 = nn.Sequential(
            nn.Conv2d(base_channels * 2, base_channels, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_channels, base_channels, 3, padding=1),
            nn.ReLU(inplace=True),
        )

        self.out_conv = nn.Conv2d(base_channels, in_channels, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        e1 = self.enc1(x)
        p1 = self.pool1(e1)

        e2 = self.enc2(p1)
        p2 = self.pool2(e2)

        b = self.bottleneck(p2)

        u2 = self.up2(b)
        u2 = torch.cat([u2, e2], dim=1)
        d2 = self.dec2(u2)

        u1 = self.up1(d2)
        u1 = torch.cat([u1, e1], dim=1)
        d1 = self.dec1(u1)

        out = self.out_conv(d1)
        return torch.sigmoid(out)


class DeblurModel:
    """Wrapper around DeblurUNet with OpenCV/Numpy I/O.

    If weights are not found, `enhance` simply returns the input image.
    """

    def __init__(self, weights_path: str | None = None):
        if weights_path is None:
            weights_path = str(
                Path(__file__).resolve().parent
                / "runs"
                / "deblur"
                / "deblur_unet.pt"
            )

        self.weights_path = weights_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = DeblurUNet().to(self.device)
        self.enabled = False

        if os.path.exists(self.weights_path):
            try:
                state = torch.load(self.weights_path, map_location=self.device)
                self.model.load_state_dict(state)
                self.model.eval()
                self.enabled = True
                print(f"Loaded deblur model from {self.weights_path} on {self.device}.")
            except Exception as exc:  # pragma: no cover - defensive
                print(f"Failed to load deblur model weights: {exc}")
        else:
            print(
                f"Deblur weights not found at {self.weights_path}. "
                "Running without enhancement until training is done."
            )

    @torch.no_grad()
    def enhance(self, image_bgr: np.ndarray) -> np.ndarray:
        """Apply deblurring/enhancement to a BGR image.

        Returns the enhanced BGR image. If the model is disabled, returns input.
        """
        if not self.enabled:
            return image_bgr

        if image_bgr is None or image_bgr.size == 0:
            return image_bgr

        # Convert BGR -> RGB and normalize to [0, 1]
        img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        img_rgb = img_rgb.astype("float32") / 255.0

        h, w, _ = img_rgb.shape
        
        # Pad to make dimensions divisible by 4 (for 2x pooling layers)
        pad_h = (4 - h % 4) % 4
        pad_w = (4 - w % 4) % 4
        if pad_h > 0 or pad_w > 0:
            img_rgb = np.pad(img_rgb, ((0, pad_h), (0, pad_w), (0, 0)), mode='reflect')
        
        tensor = torch.from_numpy(img_rgb).permute(2, 0, 1).unsqueeze(0).to(self.device)

        out = self.model(tensor)
        out = out.squeeze(0).permute(1, 2, 0).cpu().numpy()
        
        # Crop back to original size if we padded
        if pad_h > 0 or pad_w > 0:
            out = out[:h, :w, :]
        
        out = np.clip(out * 255.0, 0, 255).astype("uint8")

        # RGB -> BGR
        enhanced_bgr = cv2.cvtColor(out, cv2.COLOR_RGB2BGR)
        # Resize back to original if needed (guard for rounding issues)
        if enhanced_bgr.shape[:2] != (h, w):
            enhanced_bgr = cv2.resize(enhanced_bgr, (w, h), interpolation=cv2.INTER_LINEAR)
        return enhanced_bgr


# Singleton instance used by the WebSocket pipeline

deblur_model = DeblurModel()

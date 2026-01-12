"""Enhanced image restoration module using pretrained models.

This module provides:
1. Motion blur correction using Real-ESRGAN (handles both deblur + enhancement)
2. Low-light enhancement 
3. Combined processing pipeline

Uses pretrained models that work out-of-box for real-world images.
"""

import os
from pathlib import Path
import cv2
import numpy as np
import torch
import torch.nn as nn

# Check if we can use GPU
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- MONKEY PATCH FOR BASICKSR/REAL-ESRGAN ---
# Fixes: No module named 'torchvision.transforms.functional_tensor'
try:
    from torchvision.transforms import functional as F
    import sys
    import types
    
    # Create the missing module
    ft_module = types.ModuleType("torchvision.transforms.functional_tensor")
    
    # Copy essential functions from functional to our new fake module
    # basicsr uses these specific functions usually
    for name in dir(F):
        if not name.startswith("_"):
            setattr(ft_module, name, getattr(F, name))
    
    # Inject into sys.modules
    sys.modules["torchvision.transforms.functional_tensor"] = ft_module
    
    # ALSO inject into torchvision.transforms package
    import torchvision.transforms
    setattr(torchvision.transforms, "functional_tensor", ft_module)
    
    print("Patched torchvision.transforms.functional_tensor for Real-ESRGAN compatibility.")
except Exception as e:
    print(f"Failed to patch torchvision: {e}")
# ---------------------------------------------


class EnhancedDeblurModel:
    """Combined deblurring and enhancement using multiple techniques.
    
    Pipeline:
    1. Low-light enhancement (if image is dark)
    2. Motion blur correction
    3. Sharpening post-process
    """
    
    def __init__(self):
        self.device = DEVICE
        self.enabled = True
        
        # Try to load Real-ESRGAN for combined deblur+enhance
        self.realesrgan = None
        self._init_realesrgan()
        
        # Fallback: classical image processing
        self.use_classical = self.realesrgan is None
        
        print(f"Enhanced deblur initialized on {self.device}. "
              f"Real-ESRGAN: {'Enabled' if self.realesrgan else 'Disabled (using classical)'}")
    
    def _init_realesrgan(self):
        """Try to initialize Real-ESRGAN model."""
        try:
            from basicsr.archs.rrdbnet_arch import RRDBNet
            from realesrgan import RealESRGANer
            
            # Use RealESRGAN-x2plus for speed (2x upscale then downscale)
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, 
                          num_block=23, num_grow_ch=32, scale=2)
            
            # Model weight path
            weights_dir = Path(__file__).parent / "weights"
            weights_dir.mkdir(exist_ok=True)
            weight_path = weights_dir / "RealESRGAN_x2plus.pth"
            
            if not weight_path.exists():
                print(f"Real-ESRGAN weights not found at {weight_path}. Downloading...")
                self._download_realesrgan_weights(weight_path)
            
            if weight_path.exists():
                self.realesrgan = RealESRGANer(
                    scale=2,
                    model_path=str(weight_path),
                    dni_weight=None,
                    model=model,
                    tile=400,  # Process in tiles to save VRAM
                    tile_pad=10,
                    pre_pad=0,
                    half=True if self.device.type == 'cuda' else False,
                    device=self.device,
                )
                print("Real-ESRGAN loaded successfully.")
            
        except ImportError as e:
            print(f"Real-ESRGAN not available: {e}. Using classical methods.")
        except Exception as e:
            print(f"Failed to load Real-ESRGAN: {e}. Using classical methods.")
    
    def _download_realesrgan_weights(self, path: Path):
        """Download Real-ESRGAN weights."""
        try:
            import urllib.request
            url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth"
            print(f"Downloading from {url}...")
            urllib.request.urlretrieve(url, str(path))
            print("Download complete.")
        except Exception as e:
            print(f"Failed to download weights: {e}")
    
    def _enhance_low_light(self, image: np.ndarray) -> np.ndarray:
        """Enhance low-light images using CLAHE and gamma correction."""
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Check if image is dark (low average luminance)
        avg_brightness = np.mean(l)
        
        if avg_brightness < 80:  # Dark image threshold
            # Apply CLAHE to L channel
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            # Gamma correction for additional brightening
            gamma = 0.7  # < 1 brightens
            l = np.power(l / 255.0, gamma) * 255.0
            l = l.astype(np.uint8)
        
        # Merge and convert back
        enhanced_lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
        
        return enhanced
    
    def _classical_deblur(self, image: np.ndarray) -> np.ndarray:
        """Classical deblurring using Wiener deconvolution approximation."""
        # Convert to float
        img_float = image.astype(np.float64) / 255.0
        
        # Estimate blur kernel (simplified motion blur)
        # Apply unsharp masking as a simple deblur approximation
        gaussian = cv2.GaussianBlur(img_float, (0, 0), 3)
        sharpened = cv2.addWeighted(img_float, 1.5, gaussian, -0.5, 0)
        
        # Clip and convert back
        sharpened = np.clip(sharpened * 255, 0, 255).astype(np.uint8)
        
        # Apply bilateral filter to reduce noise while preserving edges
        denoised = cv2.bilateralFilter(sharpened, 9, 75, 75)
        
        return denoised
    
    def _sharpen(self, image: np.ndarray) -> np.ndarray:
        """Apply sharpening kernel."""
        kernel = np.array([
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ])
        return cv2.filter2D(image, -1, kernel)
    
    @torch.no_grad()
    def enhance(self, image_bgr: np.ndarray) -> np.ndarray:
        """Full enhancement pipeline: low-light → deblur → sharpen.
        
        Args:
            image_bgr: BGR image (numpy array)
            
        Returns:
            Enhanced BGR image
        """
        if not self.enabled or image_bgr is None or image_bgr.size == 0:
            return image_bgr
        
        try:
            # Step 1: Low-light enhancement
            enhanced = self._enhance_low_light(image_bgr)
            
            # Step 2: Deblurring
            if self.realesrgan is not None:
                # Use Real-ESRGAN (upscales 2x, then we downscale)
                output, _ = self.realesrgan.enhance(enhanced, outscale=2)
                # Downscale back to original size
                h, w = image_bgr.shape[:2]
                enhanced = cv2.resize(output, (w, h), interpolation=cv2.INTER_LANCZOS4)
            else:
                # Fallback to classical methods
                enhanced = self._classical_deblur(enhanced)
            
            # Step 3: Final sharpening
            enhanced = self._sharpen(enhanced)
            
            return enhanced
            
        except Exception as e:
            print(f"Enhancement error: {e}")
            return image_bgr


# Singleton instance
enhanced_deblur_model = EnhancedDeblurModel()

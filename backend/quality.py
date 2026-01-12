import cv2
import numpy as np


def compute_blur_laplacian(image: np.ndarray) -> float:
    """Return a simple blur score using the variance of the Laplacian.

    Higher values = sharper image, lower values = more blurred.
    """
    if image is None or image.size == 0:
        return 0.0

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    return float(lap.var())


def compute_brightness(image: np.ndarray) -> float:
    """Return average brightness in [0, 255]."""
    if image is None or image.size == 0:
        return 0.0

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return float(gray.mean())

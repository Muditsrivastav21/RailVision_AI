"""Robust OCR module for Indian railway wagon numbers.

This module is designed to extract 11-digit wagon numbers from video frames
of blue railway wagons with white text markings.
"""

import cv2
import numpy as np
import re

print("[OCR Module] Loading OCR engine...")

# Initialize OCR globally at module load
_reader = None

def init_ocr():
    """Initialize EasyOCR reader."""
    global _reader
    if _reader is not None:
        return _reader
    
    try:
        import easyocr
        print("[OCR] Initializing EasyOCR...")
        _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        print("[OCR] EasyOCR ready!")
        return _reader
    except ImportError:
        print("[OCR] EasyOCR not installed, trying PaddleOCR...")
        try:
            from paddleocr import PaddleOCR
            _reader = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            print("[OCR] PaddleOCR ready!")
            return _reader
        except:
            print("[OCR] ERROR: No OCR engine available!")
            return None

# Initialize at import time
init_ocr()


def extract_all_text(image: np.ndarray) -> list:
    """Run OCR on image and return all detected text."""
    global _reader
    if _reader is None:
        init_ocr()
    if _reader is None:
        return []
    
    results = []
    
    try:
        # Check if EasyOCR or PaddleOCR
        if hasattr(_reader, 'readtext'):
            # EasyOCR
            rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            detections = _reader.readtext(rgb)
            for (bbox, text, conf) in detections:
                if conf > 0.1:  # Very low threshold to catch everything
                    results.append((text.strip(), float(conf)))
        else:
            # PaddleOCR
            result = _reader.ocr(image, cls=True)
            if result and result[0]:
                for line in result[0]:
                    if line and len(line) >= 2:
                        text = line[1][0]
                        conf = float(line[1][1])
                        if conf > 0.1:
                            results.append((text.strip(), conf))
    except Exception as e:
        print(f"[OCR] Error during text extraction: {e}")
    
    return results


def enhance_for_ocr(image: np.ndarray) -> list:
    """Create multiple enhanced versions of the image for better OCR."""
    enhanced_images = []
    
    h, w = image.shape[:2]
    
    # 1. Upscale if small
    if w < 600:
        scale = 2
        upscaled = cv2.resize(image, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
        enhanced_images.append(("upscaled", upscaled))
    else:
        enhanced_images.append(("original", image))
    
    # 2. Grayscale + high contrast
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
    high_contrast = clahe.apply(gray)
    enhanced_images.append(("high_contrast", cv2.cvtColor(high_contrast, cv2.COLOR_GRAY2BGR)))
    
    # 3. Threshold for white text
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    enhanced_images.append(("thresh_white", cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)))
    
    # 4. Inverted (black text on white background)
    inverted = cv2.bitwise_not(gray)
    enhanced_images.append(("inverted", cv2.cvtColor(inverted, cv2.COLOR_GRAY2BGR)))
    
    # 5. Sharpen
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(image, -1, kernel)
    enhanced_images.append(("sharpened", sharpened))
    
    # 6. Denoise + threshold
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    _, clean_thresh = cv2.threshold(denoised, 127, 255, cv2.THRESH_BINARY)
    enhanced_images.append(("clean", cv2.cvtColor(clean_thresh, cv2.COLOR_GRAY2BGR)))
    
    return enhanced_images


def find_wagon_numbers(all_text: str) -> list:
    """Extract valid wagon numbers from OCR text.
    
    Indian wagon numbers: 11 digits, sometimes with spaces.
    Example: 25089 60970 1 or 2508960970-1
    """
    if not all_text:
        return []
    
    numbers = []
    
    # Clean the text
    text = all_text.upper()
    
    # Method 1: Find any sequence of 10+ digits
    digits_only = re.sub(r'[^0-9]', '', text)
    if len(digits_only) >= 10:
        # Take chunks of 11 digits
        for i in range(0, len(digits_only) - 9, 1):
            chunk = digits_only[i:i+11]
            if len(chunk) >= 10:
                # Format as XXXXX XXXXX X
                formatted = f"{chunk[:5]} {chunk[5:10]}"
                if len(chunk) > 10:
                    formatted += f" {chunk[10:]}"
                if formatted not in numbers:
                    numbers.append(formatted.strip())
    
    # Method 2: Find patterns like "12345 67890" or "1234567890"
    pattern_matches = re.findall(r'(\d{4,6})\s*(\d{4,6})', text)
    for m in pattern_matches:
        combined = m[0] + m[1]
        if len(combined) >= 10:
            formatted = f"{combined[:5]} {combined[5:10]}"
            if len(combined) > 10:
                formatted += f" {combined[10:]}"
            if formatted not in numbers:
                numbers.append(formatted.strip())
    
    # Method 3: Just return any long number sequence found
    long_nums = re.findall(r'\d{5,}', text)
    for num in long_nums:
        if len(num) >= 5 and num not in numbers:
            numbers.append(num)
    
    return numbers[:5]  # Return up to 5 numbers


def scan_frame_for_wagon_numbers(image: np.ndarray) -> tuple:
    """Main function: Scan a video frame and extract wagon numbers.
    
    Returns:
        (list of wagon numbers, raw OCR text)
    """
    print(f"[OCR] Scanning frame {image.shape}...")
    
    all_text_found = []
    all_numbers = []
    
    # Create enhanced versions
    enhanced = enhance_for_ocr(image)
    
    for name, img in enhanced:
        # Run OCR
        texts = extract_all_text(img)
        
        if texts:
            print(f"[OCR] {name}: Found {len(texts)} text items")
            for text, conf in texts:
                print(f"  - '{text}' ({conf:.1%})")
                all_text_found.append(text)
        
        # Extract wagon numbers from this version
        combined_text = " ".join([t for t, c in texts])
        numbers = find_wagon_numbers(combined_text)
        for n in numbers:
            if n not in all_numbers:
                all_numbers.append(n)
    
    raw_text = " ".join(all_text_found)
    print(f"[OCR] Total: {len(all_numbers)} wagon number(s) found")
    
    return all_numbers, raw_text


def batch_extract_wagon_numbers(image: np.ndarray, ocr_detections: list) -> list:
    """Extract wagon numbers from full frame (ignoring small detections).
    
    This function runs OCR on the entire frame to find wagon numbers,
    regardless of whether the YOLO model detected any regions.
    """
    print("\n" + "="*50)
    print("[OCR] Running wagon number extraction...")
    print("="*50)
    
    # Always scan the full frame
    numbers, raw_text = scan_frame_for_wagon_numbers(image)
    
    # Create detection entries for each number found
    result_detections = []
    
    if numbers:
        for i, num in enumerate(numbers):
            result_detections.append({
                'class': 'Wagon ID',
                'type': 'ocr',
                'confidence': 0.85,
                'bbox': [0, 0, image.shape[1], image.shape[0]],
                'text': num,
                'ocr_confidence': 0.85,
                'raw_text': raw_text[:200] if raw_text else ''
            })
        print(f"[OCR] Returning {len(result_detections)} wagon numbers: {numbers}")
    else:
        # Return any existing YOLO detections even if OCR failed
        for det in ocr_detections:
            if det.get('type') == 'ocr':
                det['text'] = ''
                result_detections.append(det)
        print("[OCR] No wagon numbers found in frame")
    
    print("="*50 + "\n")
    return result_detections

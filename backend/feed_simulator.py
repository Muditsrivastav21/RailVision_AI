import os
import asyncio
import base64
import random
import time
from pathlib import Path

# Path to the local dataset (Input Source)
# Switching to Roboflow Wagon Data to ensure we see Trains, not Cars
import cv2
import numpy as np

# Path to the local dataset (Input Source)
# Switching to latest user-provided video
DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "screen_recording_1.mp4")

class FeedSimulator:
    def __init__(self, fps=25): # Increased FPS for video
        self.fps = fps
        self.delay = 1.0 / fps
        self.is_video = False
        
        path = Path(DATASET_PATH)
        if path.is_file() and path.suffix.lower() in ['.mp4', '.avi', '.mov', '.mkv']:
            self.is_video = True
            self.cap = cv2.VideoCapture(str(path))
            print(f"Loaded Video source: {DATASET_PATH}")
        else:
            self._load_images()

    def _load_images(self):
        """Loads all .png and .jpg files from the dataset directory."""
        path = Path(DATASET_PATH)
        if path.exists() and path.is_dir():
            # Support both formats
            self.image_files = list(path.glob("*.png")) + list(path.glob("*.jpg")) + list(path.glob("*.jpeg"))
            self.image_files.sort(key=lambda x: x.stem) # Sort correctly
            print(f"Loaded {len(self.image_files)} images for simulation.")
        else:
            print(f"Dataset path not found or invalid: {DATASET_PATH}")
            self.image_files = []

    async def generate_frames(self):
        """Yields base64 encoded frames mimicking a live stream."""
        idx = 0
        
        while True:
            frame_content = None
            filename = f"frame_{idx}"
            
            if self.is_video:
                ret, frame = self.cap.read()
                if not ret:
                    # Loop video
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                
                # Resize if too big (for performance)
                # frame = cv2.resize(frame, (1280, 720)) 
                
                # Encode to jpg
                _, buffer = cv2.imencode('.jpg', frame)
                frame_content = base64.b64encode(buffer).decode('utf-8')
                
            else:
                # Image Mode
                if not self.image_files:
                    yield None
                    await asyncio.sleep(1)
                    continue
                    
                img_path = self.image_files[idx]
                filename = img_path.name
                try:
                    with open(img_path, "rb") as img_file:
                        frame_content = base64.b64encode(img_file.read()).decode('utf-8')
                except Exception as e:
                    print(f"Error reading frame {img_path}: {e}")
            
            if frame_content:
                metadata = {
                    "frame_id": idx,
                    "filename": filename,
                    "timestamp": time.time(),
                    "detections": [] 
                }
                
                yield {
                    "image": f"data:image/jpeg;base64,{frame_content}",
                    "metadata": metadata
                }

            # Next frame logic
            if not self.is_video:
                idx = (idx + 1) % len(self.image_files)
                
            await asyncio.sleep(self.delay)

simulator = FeedSimulator(fps=25)

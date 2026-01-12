"""Multi-camera feed simulator for railway wagon monitoring.

Supports 3 camera streams as required by the problem statement.
Each camera can be configured with different video sources.
"""

import os
import asyncio
import base64
import time
from pathlib import Path
from typing import Dict, Optional

import cv2
import numpy as np

# Base directory for project root
PROJECT_ROOT = Path(__file__).parent.parent

# Video assets directory
VIDEOS_DIR = PROJECT_ROOT / "assets" / "videos"

# Camera configurations - 3 cameras as per requirement
# Each camera uses a different video file
CAMERA_CONFIGS = {
    "cam_1": {
        "name": "Camera 1 - Entry Point",
        "source": VIDEOS_DIR / "cam_1.mp4",
        "location": "Loading Bay Entry",
        "fps": 25,
    },
    "cam_2": {
        "name": "Camera 2 - Mid Section", 
        "source": VIDEOS_DIR / "cam_2.mp4",
        "location": "Loading Bay Center",
        "fps": 25,
    },
    "cam_3": {
        "name": "Camera 3 - Exit Point",
        "source": VIDEOS_DIR / "cam_3.mp4",
        "location": "Loading Bay Exit",
        "fps": 25,
    },
}


class CameraFeed:
    """Individual camera feed handler."""
    
    def __init__(self, camera_id: str, config: dict):
        self.camera_id = camera_id
        self.name = config.get("name", camera_id)
        self.location = config.get("location", "Unknown")
        self.source_path = Path(config.get("source", ""))
        self.fps = config.get("fps", 25)
        self.delay = 1.0 / self.fps
        self.frame_offset = config.get("frame_offset", 0)
        
        self.is_video = False
        self.cap: Optional[cv2.VideoCapture] = None
        self.image_files: list = []
        self.frame_idx = 0
        
        self._init_source()
    
    def _init_source(self):
        """Initialize video or image source."""
        if self.source_path.is_file() and self.source_path.suffix.lower() in ['.mp4', '.avi', '.mov', '.mkv']:
            self.is_video = True
            self.cap = cv2.VideoCapture(str(self.source_path))
            
            # Apply frame offset if specified
            if self.frame_offset > 0:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.frame_offset)
            
            print(f"[{self.camera_id}] Loaded video: {self.source_path.name}")
        elif self.source_path.is_dir():
            self._load_images()
        else:
            print(f"[{self.camera_id}] Warning: Source not found: {self.source_path}")
    
    def _load_images(self):
        """Load images from directory."""
        if self.source_path.exists():
            self.image_files = sorted(
                list(self.source_path.glob("*.png")) + 
                list(self.source_path.glob("*.jpg")) +
                list(self.source_path.glob("*.jpeg")),
                key=lambda x: x.stem
            )
            print(f"[{self.camera_id}] Loaded {len(self.image_files)} images")
    
    def get_frame(self) -> Optional[tuple]:
        """Get next frame from source.
        
        Returns:
            Tuple of (frame_bgr, filename) or None
        """
        if self.is_video and self.cap is not None:
            ret, frame = self.cap.read()
            if not ret:
                # Loop video
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.frame_offset)
                ret, frame = self.cap.read()
                if not ret:
                    return None
            
            self.frame_idx += 1
            return frame, f"frame_{self.frame_idx}"
        
        elif self.image_files:
            idx = self.frame_idx % len(self.image_files)
            img_path = self.image_files[idx]
            frame = cv2.imread(str(img_path))
            self.frame_idx += 1
            return frame, img_path.name
        
        return None
    
    async def generate_frames(self):
        """Async generator for frames."""
        while True:
            result = self.get_frame()
            if result is not None:
                frame, filename = result
                _, buffer = cv2.imencode('.jpg', frame)
                frame_b64 = base64.b64encode(buffer).decode('utf-8')
                
                yield {
                    "image": f"data:image/jpeg;base64,{frame_b64}",
                    "metadata": {
                        "frame_id": self.frame_idx,
                        "filename": filename,
                        "timestamp": time.time(),
                        "camera_id": self.camera_id,
                        "camera_name": self.name,
                        "location": self.location,
                        "detections": [],
                    }
                }
            
            await asyncio.sleep(self.delay)


class MultiCameraManager:
    """Manager for multiple camera feeds."""
    
    def __init__(self):
        self.cameras: Dict[str, CameraFeed] = {}
        self.active_camera: str = "cam_1"
        
        # Initialize all cameras
        for cam_id, config in CAMERA_CONFIGS.items():
            self.cameras[cam_id] = CameraFeed(cam_id, config)
        
        print(f"Multi-camera manager initialized with {len(self.cameras)} cameras")
    
    def get_camera_list(self) -> list:
        """Get list of available cameras."""
        return [
            {
                "id": cam_id,
                "name": cam.name,
                "location": cam.location,
                "active": cam_id == self.active_camera,
            }
            for cam_id, cam in self.cameras.items()
        ]
    
    def set_active_camera(self, camera_id: str) -> bool:
        """Set active camera for streaming."""
        if camera_id in self.cameras:
            self.active_camera = camera_id
            print(f"Switched to camera: {camera_id}")
            return True
        return False
    
    def get_active_camera(self) -> CameraFeed:
        """Get currently active camera feed."""
        return self.cameras.get(self.active_camera, list(self.cameras.values())[0])
    
    async def generate_frames(self, camera_id: Optional[str] = None):
        """Generate frames from specified or active camera."""
        cam_id = camera_id or self.active_camera
        camera = self.cameras.get(cam_id)
        
        if camera is None:
            camera = self.get_active_camera()
        
        async for frame_data in camera.generate_frames():
            yield frame_data


# Singleton instances
camera_manager = MultiCameraManager()

# Backward compatible simulator (uses first camera)
simulator = camera_manager.get_active_camera()

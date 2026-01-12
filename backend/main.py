from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from collections import deque
from typing import Optional

from quality import compute_blur_laplacian, compute_brightness

# Try multi-camera feed first, fallback to single camera
try:
    from multi_camera_feed import camera_manager, MultiCameraManager
    print("Multi-camera support enabled (3 cameras)")
    USE_MULTI_CAMERA = True
except ImportError:
    from feed_simulator import simulator
    print("Using single camera mode")
    USE_MULTI_CAMERA = False
    camera_manager = None

# Try enhanced deblur first, fallback to basic
try:
    from enhanced_deblur import enhanced_deblur_model as deblur_model
    print("Using enhanced deblur model (Real-ESRGAN + low-light enhancement)")
except ImportError:
    from deblur_model import deblur_model
    print("Using basic U-Net deblur model")

app = FastAPI(title="RailVision AI Backend", version="2.0")

# In-memory buffer to support "top 10 frames with highest blur correction applied".
# Each item: {"score": float, "frame_id": int, "quality": {...}, "original_image": str, "enhanced_image": str}
top_frames = deque(maxlen=200)

# Wagon counting state
wagon_count = 0
wagon_ids_seen = set()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "System Online", 
        "module": "RailVision AI Backend",
        "version": "2.0",
        "features": {
            "multi_camera": USE_MULTI_CAMERA,
            "enhanced_deblur": True,
            "ocr": True,
        }
    }


@app.get("/cameras")
def get_cameras():
    """Get list of available cameras."""
    if USE_MULTI_CAMERA and camera_manager:
        return {
            "cameras": camera_manager.get_camera_list(),
            "active": camera_manager.active_camera,
        }
    return {
        "cameras": [{"id": "cam_1", "name": "Default Camera", "active": True}],
        "active": "cam_1",
    }


@app.post("/cameras/{camera_id}/activate")
def activate_camera(camera_id: str):
    """Switch active camera."""
    if USE_MULTI_CAMERA and camera_manager:
        success = camera_manager.set_active_camera(camera_id)
        return {"success": success, "active": camera_manager.active_camera}
    return {"success": False, "error": "Multi-camera not available"}


@app.get("/top-frames")
def get_top_frames(limit: int = 10):
    """Return top N frames with highest blur improvement.

    This satisfies the requirement: "Show top 10 frames with highest blur
    correction applied". The caller can control `limit`.
    """

    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 10

    limit = max(1, min(limit, 50))
    sorted_frames = sorted(list(top_frames), key=lambda x: x["score"], reverse=True)
    return sorted_frames[:limit]


@app.get("/stats")
def get_stats():
    """Get processing statistics."""
    return {
        "wagon_count": wagon_count,
        "frames_processed": len(top_frames),
        "avg_blur_improvement": sum(f["score"] for f in top_frames) / max(1, len(top_frames)),
    }


@app.websocket("/ws/feed")
async def websocket_endpoint(websocket: WebSocket, camera: Optional[str] = Query(None)):
    """WebSocket endpoint for live video feed.
    
    Query params:
        camera: Optional camera ID (cam_1, cam_2, cam_3)
    """
    await websocket.accept()
    try:
        from detector import detector
        import base64
        import numpy as np
        import cv2

        # Get frame generator based on camera selection
        if USE_MULTI_CAMERA and camera_manager:
            frame_generator = camera_manager.generate_frames(camera)
        else:
            from feed_simulator import simulator
            frame_generator = simulator.generate_frames()

        async for frame_data in frame_generator:
            if frame_data:
                # Preserve the original image string from simulator for UI comparison
                original_image_b64 = frame_data["image"]

                # 1. Decode the base64 image from simulator
                header, encoded = original_image_b64.split(",", 1)
                nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if img is None:
                    continue

                # 1.5. Compute image quality metrics before enhancement
                blur_before = compute_blur_laplacian(img)
                brightness_before = compute_brightness(img)

                # Determine lighting condition
                lighting_condition = "Daylight" if brightness_before > 60 else "Night Light"

                # 1.6. Run deblurring / enhancement
                enhanced_img = deblur_model.enhance(img)

                # 1.7. Quality metrics after enhancement
                blur_after = compute_blur_laplacian(enhanced_img)
                brightness_after = compute_brightness(enhanced_img)
                blur_improvement = blur_after - blur_before  # Higher is better (more sharp)

                # 2. Run Detection on enhanced image
                annotated_img, detections = detector.detect(enhanced_img)

                # 3. Encode images back to base64
                _, buffer_annot = cv2.imencode('.jpg', annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
                annot_text = base64.b64encode(buffer_annot).decode('utf-8')

                _, buffer_enhanced = cv2.imencode('.jpg', enhanced_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
                enhanced_text = base64.b64encode(buffer_enhanced).decode('utf-8')
                
                # 4. Update payload with images and metrics
                frame_data["image"] = f"data:image/jpeg;base64,{annot_text}"
                frame_data["original_image"] = original_image_b64
                frame_data["enhanced_image"] = f"data:image/jpeg;base64,{enhanced_text}"

                metadata = frame_data.get("metadata", {})
                metadata["detections"] = detections
                metadata["lighting_condition"] = lighting_condition
                metadata["quality"] = {
                    "blur_before": round(blur_before, 2),
                    "blur_after": round(blur_after, 2),
                    "brightness_before": round(brightness_before, 2),
                    "brightness_after": round(brightness_after, 2),
                    "blur_improvement": round(blur_improvement, 2),
                }
                frame_data["metadata"] = metadata

                # Update top-frames buffer for later querying
                try:
                    frame_id = int(metadata.get("frame_id", 0))
                except (TypeError, ValueError):
                    frame_id = 0

                top_frames.append(
                    {
                        "score": float(blur_improvement),
                        "frame_id": frame_id,
                        "camera_id": metadata.get("camera_id", "cam_1"),
                        "quality": metadata["quality"],
                        "original_image": original_image_b64,
                        "enhanced_image": frame_data["enhanced_image"],
                    }
                )
                
                await websocket.send_text(json.dumps(frame_data))
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Connection error: {e}")
        import traceback
        traceback.print_exc()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "multi_camera": USE_MULTI_CAMERA,
        "cameras_available": len(camera_manager.cameras) if camera_manager else 1,
    }

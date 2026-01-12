import os
from ultralytics import YOLO
import cv2
import numpy as np

from ocr_engine import batch_extract_wagon_numbers


class Detector:
    def __init__(self):
        # Base path for models
        base_dir = os.path.dirname(__file__)

        # 1. Damage Detection Model (latest)
        damage_model_path = os.path.join(base_dir, "runs", "detect", "wagon_damage_v13", "weights", "best.pt")
        print(f"Loading Damage Model: {damage_model_path}...")
        self.damage_model = YOLO(damage_model_path)

        # 2. OCR Model (Wagon Number)
        ocr_model_path = os.path.join(base_dir, "runs", "detect", "train_ocr_v1", "weights", "best.pt")
        print(f"Loading OCR Model: {ocr_model_path}...")
        try:
            self.ocr_model = YOLO(ocr_model_path)
            print("OCR Model Loaded.")
        except Exception as e:
            print(f"Warning: OCR Model not found or failed to load. {e}")
            self.ocr_model = None

        # 3. Bogie Type Model
        bogie_model_path = os.path.join(base_dir, "runs", "detect", "bogie_detect_v1", "weights", "best.pt")
        print(f"Loading Bogie Model: {bogie_model_path}...")
        try:
            self.bogie_model = YOLO(bogie_model_path)
            print("Bogie Model Loaded.")
        except Exception as e:
            print(f"Warning: Bogie Model failed to load. {e}")
            self.bogie_model = None

        # 4. Cargo / Container Door State Model
        cargo_model_path = os.path.join(base_dir, "runs", "detect", "cargo_container_v12", "weights", "best.pt")
        print(f"Loading Cargo/Container Model: {cargo_model_path}...")
        try:
            self.cargo_model = YOLO(cargo_model_path)
            print("Cargo/Container Model Loaded.")
        except Exception as e:
            print(f"Warning: Cargo/Container Model failed to load. {e}")
            self.cargo_model = None

        # 5. Detailed Wagon-Door Conditions Model
        wagon_door_full_path = os.path.join(base_dir, "runs", "detect", "wagon_door_full_v12", "weights", "best.pt")
        print(f"Loading Wagon Door (full) Model: {wagon_door_full_path}...")
        try:
            self.wagon_door_full_model = YOLO(wagon_door_full_path)
            print("Wagon Door (full) Model Loaded.")
        except Exception as e:
            print(f"Warning: Wagon Door (full) Model failed to load. {e}")
            self.wagon_door_full_model = None

        # 6. Simple Wagon-Door State Model
        wagon_door_simple_path = os.path.join(base_dir, "runs", "detect", "wagon_door_simple_v1", "weights", "best.pt")
        print(f"Loading Wagon Door (simple) Model: {wagon_door_simple_path}...")
        try:
            self.wagon_door_simple_model = YOLO(wagon_door_simple_path)
            print("Wagon Door (simple) Model Loaded.")
        except Exception as e:
            print(f"Warning: Wagon Door (simple) Model failed to load. {e}")
            self.wagon_door_simple_model = None

        print("All available models loaded.")

    def _run_model(self, model, img, det_type: str, override_class: str | None = None, conf: float = 0.2):
        """Run a YOLO model and convert boxes to our detection schema."""
        if model is None:
            return [], img

        detections = []
        annotated = img
        results = model(img, conf=conf)
        for r in results:
            # For damage model, keep its annotated image
            if det_type == "damage":
                annotated = r.plot()
            for box in r.boxes:
                cls_id = int(box.cls)
                cls_name = override_class if override_class is not None else model.names.get(cls_id, str(cls_id))
                detections.append(
                    {
                        "class": cls_name,
                        "confidence": float(box.conf),
                        "bbox": box.xyxy[0].tolist(),
                        "type": det_type,
                    }
                )
        return detections, annotated

    def detect(self, image_data):
        """Run all enabled models on the enhanced frame."""
        annotated_frame = image_data.copy()
        all_detections = []

        # 1. Damage detection (defines annotated_frame)
        damage_dets, annotated_frame = self._run_model(
            self.damage_model, image_data, det_type="damage", conf=0.2
        )
        all_detections.extend(damage_dets)

        # 2. OCR (wagon number regions) + text extraction
        # Always run OCR on the frame, even if YOLO doesn't detect regions
        ocr_dets = []
        if self.ocr_model is not None:
            ocr_dets, _ = self._run_model(
                self.ocr_model, image_data, det_type="ocr", override_class="Wagon ID", conf=0.15
            )
        
        # Always try to extract wagon numbers from the full frame
        # This runs even if ocr_dets is empty (full frame scan)
        ocr_dets = batch_extract_wagon_numbers(image_data, ocr_dets)
        all_detections.extend(ocr_dets)

        # 3. Bogie types
        if self.bogie_model is not None:
            bogie_dets, _ = self._run_model(self.bogie_model, image_data, det_type="bogie", conf=0.2)
            all_detections.extend(bogie_dets)

        # 4. Cargo / container / door states
        if self.cargo_model is not None:
            cargo_dets, _ = self._run_model(self.cargo_model, image_data, det_type="cargo", conf=0.2)
            all_detections.extend(cargo_dets)

        # 5. Detailed wagon-door conditions
        if self.wagon_door_full_model is not None:
            door_full_dets, _ = self._run_model(
                self.wagon_door_full_model, image_data, det_type="door_full", conf=0.2
            )
            all_detections.extend(door_full_dets)

        # 6. Simple wagon-door state
        if self.wagon_door_simple_model is not None:
            door_simple_dets, _ = self._run_model(
                self.wagon_door_simple_model, image_data, det_type="door_simple", conf=0.2
            )
            all_detections.extend(door_simple_dets)

        return annotated_frame, all_detections


# Singleton instance
detector = Detector()


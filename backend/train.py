from ultralytics import YOLO
import os

# Absolute path to the data.yaml
DATA_YAML = r"d:\@ SIDDHESH SAKLE PERSONAL\PROGRAMING\SIDDHESH VS CODE\PROGGRAMMING\ADANI_PROJECT\data\WagonDamageDetection-3\data.yaml"

def train_model():
    print("🚀 Loading YOLOv8n model...")
    model = YOLO('yolov8n.pt')  # load a pretrained model (recommended for training)

    print(f"📂 Training on dataset: {DATA_YAML}")
    
    # Train the model
    results = model.train(
        data=DATA_YAML,
        epochs=10,        # Quick training for verification
        imgsz=640,
        batch=16,
        name='wagon_damage_v1',  # Project name in runs/detect/
        device=0,        # Use GPU 0 (RTX 4060) via CUDA-enabled PyTorch
    )
    
    print("✅ Training Complete.")
    print(f"Metrics: {results}")

if __name__ == '__main__':
    train_model()

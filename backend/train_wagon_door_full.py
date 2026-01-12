from ultralytics import YOLO


DATA_YAML = r"d:\@ SIDDHESH SAKLE PERSONAL\PROGRAMING\SIDDHESH VS CODE\PROGGRAMMING\ADANI_PROJECT\data\Wagon-detection-2\data.yaml"


def train_wagon_door_full():
    print("🚀 Loading YOLOv8n model for detailed wagon/door conditions...")
    model = YOLO("yolov8n.pt")

    print(f"📂 Training wagon-door (full) model on dataset: {DATA_YAML}")

    results = model.train(
        data=DATA_YAML,
        epochs=10,
        imgsz=640,
        batch=16,
        name="wagon_door_full_v1",
        device=0,
    )

    print("✅ Wagon-door (full) training complete.")
    print(f"Metrics: {results}")


if __name__ == "__main__":
    train_wagon_door_full()

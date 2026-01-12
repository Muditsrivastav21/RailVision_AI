from ultralytics import YOLO


DATA_YAML = r"d:\@ SIDDHESH SAKLE PERSONAL\PROGRAMING\SIDDHESH VS CODE\PROGGRAMMING\ADANI_PROJECT\data\Wagon-Detection2.O-2\data.yaml"


def train_wagon_door_simple():
    print("🚀 Loading YOLOv8n model for simple wagon/door state...")
    model = YOLO("yolov8n.pt")

    print(f"📂 Training wagon-door (simple) model on dataset: {DATA_YAML}")

    results = model.train(
        data=DATA_YAML,
        epochs=10,
        imgsz=640,
        batch=16,
        name="wagon_door_simple_v1",
        device=0,
    )

    print("✅ Wagon-door (simple) training complete.")
    print(f"Metrics: {results}")


if __name__ == "__main__":
    train_wagon_door_simple()

from ultralytics import YOLO


DATA_YAML = r"d:\@ SIDDHESH SAKLE PERSONAL\PROGRAMING\SIDDHESH VS CODE\PROGGRAMMING\ADANI_PROJECT\data\cargo_container_dataset-2\data.yaml"


def train_cargo_container():
    print("🚀 Loading YOLOv8n model for cargo container & door status...")
    model = YOLO("yolov8n.pt")

    print(f"📂 Training cargo/door model on dataset: {DATA_YAML}")

    results = model.train(
        data=DATA_YAML,
        epochs=10,
        imgsz=640,
        batch=16,
        name="cargo_container_v1",
        device=0,
    )

    print("✅ Cargo container training complete.")
    print(f"Metrics: {results}")


if __name__ == "__main__":
    train_cargo_container()

from ultralytics import YOLO


DATA_YAML = r"d:\@ SIDDHESH SAKLE PERSONAL\PROGRAMING\SIDDHESH VS CODE\PROGGRAMMING\ADANI_PROJECT\data\bogie-3\data.yaml"


def train_bogie():
    print("🚀 Loading YOLOv8n model for bogie detection...")
    model = YOLO("yolov8n.pt")

    print(f"📂 Training bogie model on dataset: {DATA_YAML}")

    results = model.train(
        data=DATA_YAML,
        epochs=10,
        imgsz=640,
        batch=16,
        name="bogie_detect_v1",
        device=0,
    )

    print("✅ Bogie training complete.")
    print(f"Metrics: {results}")


if __name__ == "__main__":
    train_bogie()

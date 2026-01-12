from ultralytics import YOLO

def train_ocr():
    # Load a model
    model = YOLO('yolov8n.pt')  # load a pretrained model (recommended for training)

    # Train the model
    # We use the absolute path to data.yaml we verified earlier
    yaml_path = r"d:\@ SIDDHESH SAKLE PERSONAL\PROGRAMING\SIDDHESH VS CODE\PROGGRAMMING\ADANI_PROJECT\data\wagon_number-1\data.yaml"
    
    print("Starting OCR Training on Wagon Number dataset...")
    print(f"Dataset config: {yaml_path}")
    
    # Train for 5 epochs (Reduced for speed since we might be on CPU)
    # imgSz=640 is standard
    try:
        results = model.train(
            data=yaml_path, 
            epochs=5, 
            imgsz=640, 
            name='train_ocr_v1',
            device=0 # Use GPU 0
        )
        print("Training Complete!")
    except Exception as e:
        print(f"Training Failed: {e}")

if __name__ == '__main__':
    train_ocr()

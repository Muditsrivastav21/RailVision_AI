from roboflow import Roboflow
import os

# Ensure data directory exists
os.makedirs("../data", exist_ok=True)
os.chdir("../data")

def download_datasets():
    print("🚀 Starting Dataset Downloads...")

    # 1. Wagon Damage Detection (Key: x3bn...)
    print("\n[1/8] Downloading Wagon Damage Detection...")
    try:
        rf = Roboflow(api_key="x3bnUYhgV1lgT2za2ilU")
        project = rf.workspace("first-project-vfvg6").project("wagondamagedetection")
        version = project.version(3)
        dataset = version.download("yolov8")
        print("✅ Success.")
    except Exception as e:
        print(f"❌ Failed: {e}")

    # 2. Bogie (Key: x3bn...)
    print("\n[2/8] Downloading Bogie Components...")
    try:
        rf = Roboflow(api_key="x3bnUYhgV1lgT2za2ilU")
        project = rf.workspace("test-8oovm").project("bogie-wzzgg")
        version = project.version(3)
        dataset = version.download("yolov8")
        print("✅ Success.")
    except Exception as e:
        print(f"❌ Failed: {e}")

    # 3. Cargo Container (Key: detQ...)
    print("\n[3/8] Downloading Cargo Container...")
    try:
        rf = Roboflow(api_key="detQadSfA0vcSTS5YX8Z")
        project = rf.workspace("tigerprawnod").project("cargo_container_dataset")
        version = project.version(2)
        dataset = version.download("yolov8")
        print("✅ Success.")
    except Exception as e:
        print(f"❌ Failed: {e}")

    # 4. Train/My First Project (Key: x3bn...)
    print("\n[4/8] Downloading Train Dataset (My First Project)...")
    try:
        rf = Roboflow(api_key="x3bnUYhgV1lgT2za2ilU")
        project = rf.workspace("train-3d0vj").project("my-first-project-ev2rv")
        version = project.version(8)
        dataset = version.download("yolov8")
        print("✅ Success.")
    except Exception as e:
        print(f"❌ Failed: {e}")

    # 5. Wagon Detection 2.0 (Key: Y88Y...)
    print("\n[5/8] Downloading Wagon Detection 2.0...")
    try:
        rf = Roboflow(api_key="Y88YMQTg6uqCp4goC3c1")
        project = rf.workspace("vishakha-singh").project("wagon-detection2.o")
        version = project.version(2)
        dataset = version.download("yolov8")
        print("✅ Success.")
    except Exception as e:
        print(f"❌ Failed: {e}")

    # --- HANDLING "UNAUTHORIZED" KEYS (Trying inference/fallback) ---

    # 6. Wagon Detection eh2ov (Same workspace as #5, trying Y88Y key)
    print("\n[6/8] Downloading Wagon Detection (eh2ov)...")
    try:
        rf = Roboflow(api_key="Y88YMQTg6uqCp4goC3c1") # Inferred key
        project = rf.workspace("vishakha-singh").project("wagon-detection-eh2ov")
        version = project.version(2)
        dataset = version.download("yolov8")
        print("✅ Success (using inferred key).")
    except Exception as e:
        print(f"❌ Failed (Missing Key): {e}")

    # 7. Wagon Final (Unknown key, trying fallback x3bn...)
    print("\n[7/8] Downloading Wagon Final...")
    try:
        rf = Roboflow(api_key="x3bnUYhgV1lgT2za2ilU") # Fallback
        project = rf.workspace("yololearn-4aedy").project("wagon_final")
        version = project.version(2)
        dataset = version.download("yolov8")
        print("✅ Success (using fallback key).")
    except Exception as e:
        print(f"❌ Failed (Missing Key): {e}")

    # 8. Wagon Number (Unknown key, trying fallback x3bn...)
    print("\n[8/8] Downloading Wagon Number...")
    try:
        rf = Roboflow(api_key="x3bnUYhgV1lgT2za2ilU") # Fallback
        project = rf.workspace("autonumbsfotos").project("wagon_number-4njst")
        version = project.version(1)
        dataset = version.download("yolov8")
        print("✅ Success (using fallback key).")
    except Exception as e:
        print(f"❌ Failed (Missing Key): {e}")

    print("\n🎉 All operations complete.")

if __name__ == "__main__":
    download_datasets()

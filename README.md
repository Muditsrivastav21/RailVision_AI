# RailVision AI – Railway Video Intelligence Console

RailVision AI is an end-to-end railway wagon intelligence console. It combines a Python (FastAPI) backend with a Next.js (TypeScript) frontend to provide real-time video analytics:

- Wagon damage detection
- Wagon number OCR
- Bogie, cargo container, and door state detection
- Blur mitigation with a custom deblurring model
- Live AI Detection Engine, Video Intelligence, Damage Analytics, Timeline, and Dashboard views

---

## 1. Project Structure

```text
ADANI_PROJECT/
  backend/           # FastAPI backend + YOLO + deblur
  railsvision/       # Next.js 14 App Router frontend
  start_backend.bat
  start_frontend.bat
  start_servers.ps1
  launch_railvision.bat
```

### Backend (backend/)
- `main.py` – FastAPI app (HTTP + WebSocket feed)
- `detector.py` – loads all YOLO models and runs multi-model inference
- `deblur_model.py` – U-Net based deblurring model
- `feed_simulator.py` – streams frames from a sample MP4 as a live feed
- `quality.py` – blur and brightness metrics
- `train.py`, `train_ocr.py`, `train_bogie.py`, `train_cargo_container.py`, `train_wagon_door_full.py`, `train_wagon_door_simple.py`, `train_deblur.py` – training scripts
- `requirements.txt` – Python dependencies

### Frontend (railsvision/)
- Next.js 14 + TypeScript + Tailwind CSS
- Key routes (App Router):
  - `/dashboard` – System Dashboard
  - `/ai-detection` – AI Detection Engine (combined models)
  - `/video-intelligence` – Original vs enhanced frames + quality metrics
  - `/damage-analytics` – Damage model analytics and live feed
  - `/wagon-intelligence` – Bogie, cargo, and door intelligence
  - `/timeline` – Event timeline based on detections
- Shared components like `DetectionFeed` handle the live WebSocket feed from backend.

---

## 2. Prerequisites

- Python **3.11**
- Node.js **18+** (recommended LTS)
- Git
- (Optional but recommended) NVIDIA GPU with CUDA support for fast inference and training

---

## 3. Backend Setup (FastAPI + YOLO)

From the `backend/` folder:

```bash
# 1) Create and activate virtual environment (Windows PowerShell)
python -m venv venv
./venv/Scripts/activate

# 2) Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Configure Model Weights

This repository includes the trained YOLO and deblurring models under `backend/runs/` so that the project works **out of the box** after cloning (no separate download step required).

The detector expects YOLO model weights in the following locations (relative to `backend/`):

- Damage model: `runs/detect/wagon_damage_v13/weights/best.pt`
- OCR (wagon number): `runs/detect/train_ocr_v1/weights/best.pt`
- Bogie: `runs/detect/bogie_detect_v1/weights/best.pt`
- Cargo/container: `runs/detect/cargo_container_v12/weights/best.pt`
- Wagon door (full): `runs/detect/wagon_door_full_v12/weights/best.pt`
- Wagon door (simple): `runs/detect/wagon_door_simple_v1/weights/best.pt`

Deblur model:

- `runs/deblur/deblur_unet.pt`

If you retrain any model using the training scripts, new runs will also be saved under `backend/runs/` and can be committed if you want others to use them.

### Running the Backend

From the `backend/` directory with the virtualenv activated:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

This exposes:

- `GET /health` – basic health check
- `GET /top-frames` – top frames by blur improvement
- `GET /` – simple status JSON
- `WS /ws/feed` – WebSocket stream with:
  - annotated frame image
  - original and enhanced (deblurred) images
  - detections from all models
  - quality metrics

---

## 4. Frontend Setup (Next.js console)

From the `railsvision/` folder:

```bash
# Install Node dependencies
npm install

# Run the dev server
npm run dev
```

The app will be available at:

- http://localhost:3000

> The frontend assumes the backend is available at `http://localhost:8000`.

Key pages to visit:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/ai-detection`
- `http://localhost:3000/video-intelligence`
- `http://localhost:3000/damage-analytics`
- `http://localhost:3000/wagon-intelligence`
- `http://localhost:3000/timeline`

The root route `/` redirects to the System Dashboard.

---

## 5. One-Click Launch Scripts (Windows)

At the repo root you can use the helper scripts:

- `launch_railvision.bat` – opens two terminals and starts backend + frontend.
- `start_backend.bat` – starts/restarts backend in a loop.
- `start_frontend.bat` – starts/restarts frontend in a loop.
- `start_servers.ps1` – PowerShell script that manages backend and frontend processes.

These scripts are optional but make it easier to keep both servers running during demos.

---

## 6. Datasets and Training

The `data/` folder contains Roboflow-exported YOLO datasets (damage, wagon numbers, bogies, cargo containers, doors, etc.). These datasets are **large** and typically not pushed to public GitHub.

Training scripts (run from `backend/` with venv active):

```bash
python train.py                  # damage model
python train_ocr.py              # wagon number OCR
python train_bogie.py            # bogie type
python train_cargo_container.py  # cargo/container + door state
python train_wagon_door_full.py  # detailed wagon door conditions
python train_wagon_door_simple.py# simple door open/closed
python train_deblur.py           # deblur U-Net using blurred_sharp dataset
```

Each script writes its results (including `best.pt`) under `backend/runs/` in the paths referenced by `detector.py`.

---

## 7. GitHub Repository Contents

This project is set up so that the **models under `backend/runs/` are part of the repository**. The `.gitignore` keeps environments, build artefacts, and large/raw datasets out of Git, but **does not** ignore the trained weights.

Summary of what is typically pushed to GitHub:

- ✅ Code: all Python files under `backend/`, all Next.js/TypeScript code under `railsvision/`, and helper scripts in the repo root.
- ✅ Models: YOLO and deblur `.pt` files inside `backend/runs/` (and other `.pt` files under `backend/`).
- ❌ Virtual environments: `backend/venv/`, `backend/.venv/`.
- ❌ Frontend dependencies and build outputs: `railsvision/node_modules/`, `railsvision/.next/`.
- ❌ Datasets and raw data: everything under `data/`.
- ❌ OS/editor files: `.vscode/`, `.DS_Store`, `Thumbs.db`.

If you fork this repository and prefer to **exclude** models from version control, you can re-add ignore rules like:

```gitignore
backend/runs/
backend/*.pt
backend/**/*.pt
```

or use Git LFS to handle large binary files more efficiently.

---

## 8. Running the Full System (Summary)

1. **Backend**
   - `cd backend`
   - `./venv/Scripts/activate`
   - `pip install -r requirements.txt`
   - Place all required `.pt` model files under `backend/runs/...` as described above.
   - `uvicorn main:app --host 0.0.0.0 --port 8000`

2. **Frontend**
   - In a new terminal: `cd railsvision`
   - `npm install` (first time only)
   - `npm run dev`

3. Open `http://localhost:3000` in the browser.

You should see the RailVision AI console with live AI detections, dual feeds (original + annotated), damage analytics, wagon intelligence, and more.

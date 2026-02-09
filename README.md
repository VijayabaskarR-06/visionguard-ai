# VisionGuard AI

Real-time computer vision system for automated safety compliance monitoring.

---

## Features
- Real-time object detection using YOLO
- Intelligent tracking and association
- Multi-source video processing (webcam, IP camera, files)
- Annotated video output

## Tech Stack
- **AI/ML**: YOLOv8, YOLOv12
- **Vision**: OpenCV
- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript

## Installation

```bash
git clone <your-repo-url>
cd visionguard-ai

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

## Usage

### Local Monitoring
```bash
python3 workplace_safety_monitor.py --source 0 --ppe-weights best.pt
```

### Web Interface
```bash
python3 start_localhost.py
```
- Frontend: http://localhost:8000
- Backend: http://localhost:5001

## Configuration
- `--conf-helmet`: Detection threshold (default: 0.65)
- `--conf-vest`: Detection threshold (default: 0.70)
- `--track-iou`: Tracking consistency

---

**Personal AI Project** | 2026
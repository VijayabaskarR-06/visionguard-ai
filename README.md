# 🏗️ Intelligent Workplace Safety Monitor

An advanced AI-powered computer vision system designed to monitor and enhance workplace safety in real-time. This system leverages state-of-the-art YOLO detection models and intelligent tracking algorithms to ensure compliance with Personal Protective Equipment (PPE) standards.

---

## � Vision
The **Workplace Safety Monitor** aims to reduce workplace accidents by providing automated, real-time oversight of safety protocols. By identifying personnel and verifying the use of essential gear like helmets and safety vests, the system provides a robust layer of protection for high-risk environments.

## ✨ Key Features
- **🔍 Real-Time AI Detection**: Instantaneous identification of personnel and safety gear.
- **🧠 Smart Association**: Intelligent mapping logic that links PPE to specific individuals based on anatomical positioning.
- **📈 Temporal Tracking**: Advanced cross-frame tracking to maintain stable detection history and reduce false alerts.
- **🎥 Multi-Source Processing**: Seamlessly handles live webcam feeds, IP camera streams, and pre-recorded video files.
- **📊 Automated Reporting**: Generates annotated video outputs with visual compliance indicators.

## 🛠️ Tech Stack
- **AI/ML**: YOLOv8 & YOLOv12 for high-precision object detection.
- **Vision**: OpenCV for real-time video processing and visualization.
- **Backend**: Python-based inference engine with Flask integration.
- **Frontend**: Modern, responsive web interface for live monitoring and asset management.

## � Installation

```bash
# Clone the project
git clone <your-github-url>
cd ppe-safety-monitor

# Setup virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 🎮 How to Run

### **1. Local Monitoring**
Run the main monitor script to start detection on your default camera:
```bash
python3 workplace_safety_monitor.py --source 0 --ppe-weights best.pt
```

### **2. Web Showcase**
Launch the full web-based monitor system:
```bash
python3 start_localhost.py
```
- **Frontend**: http://localhost:8000
- **Backend**: http://localhost:5001

## ⚙️ Configuration
You can customize the detection sensitivity and tracking behavior through CLI arguments:
- `--conf-helmet`: Set helmet detection threshold (default: 0.65).
- `--conf-vest`: Set vest detection threshold (default: 0.70).
- `--track-iou`: Adjust person tracking consistency.

---

**Personal AI Project** | 2026
Built with a focus on safety, precision, and real-time performance.
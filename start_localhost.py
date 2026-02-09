#!/usr/bin/env python3
"""
PPE Safety Detection AI - Localhost Startup Script
This script sets up and runs the complete system on localhost
"""

import os
import sys
import time
import subprocess
import threading
import signal
from pathlib import Path

def print_banner():
    print("🏗️  PPE Safety Detection AI System")
    print("=" * 50)
    print()

def check_dependencies():
    """Check if required dependencies are installed"""
    print("📦 Checking dependencies...")
    
    try:
        import flask
        import flask_cors
        import cv2
        import numpy
        print("✅ Core dependencies found")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Installing dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements_web.txt"])
        print("✅ Dependencies installed")

def check_models():
    """Check if model files exist"""
    models = ["best.pt", "yolo12n.pt"]
    for model in models:
        if not Path(model).exists():
            print(f"⚠️  Warning: {model} model file not found")
        else:
            print(f"✅ Found {model}")

def create_directories():
    """Create necessary directories"""
    dirs = ["uploads", "showcase/assets/processed", "output"]
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    print("✅ Directories created")

def start_flask_server():
    """Start Flask backend server"""
    print("🚀 Starting Flask backend server...")
    try:
        subprocess.run([sys.executable, "app.py"], check=True)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"❌ Flask server error: {e}")

def start_http_server():
    """Start HTTP server for frontend"""
    print("🌐 Starting web interface server...")
    os.chdir("showcase")
    try:
        subprocess.run([sys.executable, "-m", "http.server", "8000"], check=True)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"❌ HTTP server error: {e}")

def main():
    print_banner()
    
    # Check dependencies
    check_dependencies()
    
    # Check models
    check_models()
    
    # Create directories
    create_directories()
    
    print()
    print("🚀 Starting servers...")
    print("Backend: http://127.0.0.1:5001")
    print("Frontend: http://127.0.0.1:8000")
    print()
    print("Press Ctrl+C to stop")
    print()
    
    # Start Flask server in a separate thread
    flask_thread = threading.Thread(target=start_flask_server, daemon=True)
    flask_thread.start()
    
    # Wait a moment for Flask to start
    time.sleep(3)
    
    try:
        # Start HTTP server (this will block)
        start_http_server()
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        print("✅ System stopped")

if __name__ == "__main__":
    main()
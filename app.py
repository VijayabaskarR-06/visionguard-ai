import os
import subprocess
import uuid
import sys
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
# Enable CORS for all routes and origins for the showcase demo
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = os.path.join('showcase', 'assets', 'processed')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Track active processes
processes = {}

@app.route('/upload', methods=['POST'])
def upload_video():
    print("Received upload request")
    if 'video' not in request.files:
        print("Error: No video part in request")
        return jsonify({"error": "No video part"}), 400
    
    file = request.files['video']
    print(f"File received: {file.filename}")
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Generate unique ID for this processing task
    task_id = str(uuid.uuid4())[:8]
    filename = f"{task_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # Define output directory for this task
    output_dir = os.path.join(PROCESSED_FOLDER, task_id)
    os.makedirs(output_dir, exist_ok=True)

    # Run the AI monitor as a subprocess asynchronously
    try:
        cmd = [
            sys.executable, "workplace_safety_monitor.py",
            "--source", filepath,
            "--ppe-weights", "best.pt",
            "--save-vis", output_dir,
            "--no-show"
        ]
        
        print(f"Starting async command: {' '.join(cmd)}")
        # Start the process in the background and capture stderr to a file for debugging
        log_file = open(os.path.join(output_dir, "process.log"), "w")
        process = subprocess.Popen(cmd, stdout=log_file, stderr=subprocess.STDOUT)
        processes[task_id] = (process, log_file)
        
        processed_video_url = f"/assets/processed/{task_id}/output.mp4"
        
        return jsonify({
            "success": True,
            "task_id": task_id,
            "video_url": processed_video_url
        })

    except Exception as e:
        print(f"Error starting subprocess: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/status/<task_id>')
def get_status(task_id):
    if task_id not in processes:
        # Check if dir exists to see if it was a previously completed task
        output_dir = os.path.join(PROCESSED_FOLDER, task_id)
        if os.path.exists(output_dir):
            # Check for success file or check if output.mp4 exists as a proxy for success
            if os.path.exists(os.path.join(output_dir, "success.txt")):
                return jsonify({"status": "completed"})
            if os.path.exists(os.path.join(output_dir, "error.txt")):
                try:
                    with open(os.path.join(output_dir, "error.txt"), "r") as f:
                        return jsonify({"status": "failed", "error": f.read()})
                except:
                    return jsonify({"status": "failed", "error": "Unknown previous failure"})
            
            # If neither exist but output.mp4 does, assume it was an old successful run
            if os.path.exists(os.path.join(output_dir, "output.mp4")):
                return jsonify({"status": "completed"})
                
        return jsonify({"error": "Task not found"}), 404
    
    process, log_file = processes[task_id]
    poll = process.poll()
    
    # Calculate current progress based on frame count
    output_dir = os.path.join(PROCESSED_FOLDER, task_id)
    frames_count = len([f for f in os.listdir(output_dir) if f.startswith('frame_') and f.endswith('.jpg')])
    
    if poll is None:
        return jsonify({"status": "processing", "frames": frames_count})
    else:
        # Process finished
        log_file.close()
        return_code = poll
        del processes[task_id]
        
        # Read the log to check for errors if failed
        error_msg = ""
        if return_code != 0:
            try:
                with open(os.path.join(output_dir, "process.log"), "r") as f:
                    error_msg = f.read()
                with open(os.path.join(output_dir, "error.txt"), "w") as f:
                    f.write(error_msg)
            except:
                error_msg = f"Process exited with code {return_code}"
            return jsonify({"status": "failed", "error": error_msg})
        else:
            with open(os.path.join(output_dir, "success.txt"), "w") as f:
                f.write("completed")
            return jsonify({"status": "completed", "frames": frames_count})

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join('showcase', 'assets'), filename)

@app.route('/assets/processed/<path:task_id>/<path:filename>')
def serve_processed(task_id, filename):
    directory = os.path.join(PROCESSED_FOLDER, task_id)
    # Check if file is a video or image
    mimetype = 'video/mp4' if filename.endswith('.mp4') else 'image/jpeg'
    return send_from_directory(directory, filename, mimetype=mimetype)

if __name__ == '__main__':
    app.run(port=5001, debug=True)

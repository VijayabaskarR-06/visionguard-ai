import os
import subprocess
import uuid
import sys
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = os.path.join('showcase', 'assets', 'processed')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)


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

    
    task_id = str(uuid.uuid4())[:8]
    filename = f"{task_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    
    output_dir = os.path.join(PROCESSED_FOLDER, task_id)
    os.makedirs(output_dir, exist_ok=True)

    
    try:
        cmd = [
            sys.executable, "workplace_safety_monitor.py",
            "--source", filepath,
            "--ppe-weights", "best.pt",
            "--save-vis", output_dir,
            "--no-show"
        ]
        
        print(f"Starting async command: {' '.join(cmd)}")
        
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
        
        output_dir = os.path.join(PROCESSED_FOLDER, task_id)
        if os.path.exists(output_dir):
            
            if os.path.exists(os.path.join(output_dir, "success.txt")):
                return jsonify({"status": "completed"})
            if os.path.exists(os.path.join(output_dir, "error.txt")):
                try:
                    with open(os.path.join(output_dir, "error.txt"), "r") as f:
                        return jsonify({"status": "failed", "error": f.read()})
                except:
                    return jsonify({"status": "failed", "error": "Unknown previous failure"})
            
            
            if os.path.exists(os.path.join(output_dir, "output.mp4")):
                return jsonify({"status": "completed"})
                
        return jsonify({"error": "Task not found"}), 404
    
    process, log_file = processes[task_id]
    poll = process.poll()
    
    
    output_dir = os.path.join(PROCESSED_FOLDER, task_id)
    frames_count = len([f for f in os.listdir(output_dir) if f.startswith('frame_') and f.endswith('.jpg')])
    
    if poll is None:
        return jsonify({"status": "processing", "frames": frames_count})
    else:
        
        log_file.close()
        return_code = poll
        del processes[task_id]
        
        
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
    
    mimetype = 'video/mp4' if filename.endswith('.mp4') else 'image/jpeg'
    return send_from_directory(directory, filename, mimetype=mimetype)

if __name__ == '__main__':
    app.run(port=5001, debug=True)

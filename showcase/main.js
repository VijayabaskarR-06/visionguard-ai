document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply fade-in to sections and cards
    const fadeElements = document.querySelectorAll('section, .glass-card');
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(el);
    });

    // Custom CSS for visible state
    const style = document.createElement('style');
    style.textContent = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Gallery Lightbox Effect
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.inset = '0';
            overlay.style.background = 'rgba(0,0,0,0.9)';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = '1000';
            overlay.style.cursor = 'zoom-out';
            overlay.style.backdropFilter = 'blur(10px)';

            const fullImg = document.createElement('img');
            fullImg.src = img.src;
            fullImg.style.maxWidth = '90%';
            fullImg.style.maxHeight = '90%';
            fullImg.style.borderRadius = '1rem';
            fullImg.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';

            overlay.appendChild(fullImg);
            document.body.appendChild(overlay);

            overlay.addEventListener('click', () => {
                document.body.removeChild(overlay);
            });
        });
    });

    // Parallax effect on background blobs
    document.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) / 50;
        const moveY = (e.clientY - window.innerHeight / 2) / 50;

        const blobs = document.querySelectorAll('.background-blob');
        blobs[0].style.transform = `translate(${moveX}px, ${moveY}px)`;
        blobs[1].style.transform = `translate(${-moveX}px, ${-moveY}px)`;
    });

    // --- AI Integration / Upload Logic ---
    const dropZone = document.getElementById('drop-zone');
    const videoUpload = document.getElementById('video-upload');
    const uploadStatus = document.getElementById('upload-status');
    const progress = document.getElementById('progress');
    const demoVideo = document.querySelector('.demo video');
    const fileInfo = document.getElementById('file-info');
    const filenameDisplay = document.getElementById('filename-display');
    const analyzeBtn = document.getElementById('analyze-btn');

    let selectedFile = null;

    dropZone.addEventListener('click', () => videoUpload.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        console.log('File dropped');
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            console.log('Valid video file:', file.name);
            prepareFile(file);
        } else {
            alert('Please drop a valid video file.');
        }
    });

    videoUpload.addEventListener('change', (e) => {
        console.log('File selected via input');
        const file = e.target.files[0];
        if (file) prepareFile(file);
    });

    function prepareFile(file) {
        selectedFile = file;
        filenameDisplay.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        dropZone.classList.add('hidden');
        fileInfo.classList.remove('hidden');
    }

    const reloadBtn = document.getElementById('reload-video-btn');

    reloadBtn.addEventListener('click', () => {
        if (demoVideo.src) {
            demoVideo.load();
            demoVideo.play();
            reloadBtn.classList.add('hidden');
        }
    });

    async function handleUpload(file) {
        console.log('Starting upload for:', file.name);
        // Show loading state
        fileInfo.classList.add('hidden');
        uploadStatus.classList.remove('hidden');
        reloadBtn.classList.add('hidden');

        // Clear previous results from gallery
        const galleryGrid = document.querySelector('.gallery-grid');
        galleryGrid.innerHTML = '';

        const formData = new FormData();
        formData.append('video', file);

        // Detect if running on Vercel (no backend on same host)
        const isVercel = window.location.hostname.includes('vercel.app');
        const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:5001` : '';

        // If on Vercel or no API base, use Demo Mode
        if (isVercel || !apiBase) {
            console.log("Running in Demo Mode (Backend unavailable)");
            simulateProcessing(file);
            return;
        }

        let isProcessing = true;
        // ... rest of real upload logic ...
        let frameCount = 0;
        let lastFoundFrame = -1;

        // Function to poll for new frames
        const pollFrames = async (taskId) => {
            if (!isProcessing) return;

            // Try to find the next frame
            // We'll look ahead a bit to find the latest frame available
            let foundInThisPulse = false;
            let checkIdx = lastFoundFrame + 1;

            // Limit lookahead to avoid too many requests
            const maxLookahead = 5;

            for (let i = 0; i < maxLookahead; i++) {
                const currentIdx = checkIdx + i;
                const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:5001` : '';
                const frameUrl = `${apiBase}/assets/processed/${taskId}/frame_${String(currentIdx).padStart(6, '0')}.jpg`;

                try {
                    const imgResponse = await fetch(frameUrl, { method: 'HEAD' });
                    if (imgResponse.ok) {
                        console.log('Frame found:', currentIdx);
                        lastFoundFrame = currentIdx;
                        foundInThisPulse = true;

                        // Add to gallery if it's a "highlight" (every 20th frame or so to keep it clean)
                        if (currentIdx % 20 === 0) {
                            const item = document.createElement('div');
                            item.className = 'gallery-item glass-card visible fade-in';
                            item.style.animation = 'fadeInUp 0.5s ease forwards';
                            item.innerHTML = `
                                <img src="${frameUrl}" alt="Detection Frame ${currentIdx}">
                                <div class="overlay"><span>Detection #${currentIdx}</span></div>
                            `;
                            // Wire up lightbox for new items
                            item.addEventListener('click', () => {
                                showLightbox(frameUrl);
                            });
                            galleryGrid.prepend(item);
                        }
                    } else {
                        break; // No more frames found for now
                    }
                } catch (e) {
                    break;
                }
            }

            if (isProcessing) setTimeout(() => pollFrames(taskId), foundInThisPulse ? 100 : 500);
        };

        // Function to poll task status
        const pollStatus = async (taskId) => {
            try {
                const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:5001` : '';
                const response = await fetch(`${apiBase}/status/${taskId}`);
                const data = await response.json();
                console.log('Task status:', data.status);

                if (data.status === 'completed') {
                    isProcessing = false;
                    completeAnalysis(taskId);
                } else if (data.status === 'failed') {
                    isProcessing = false;
                    alert('Analysis failed: ' + (data.error || 'Unknown error'));
                    resetUI();
                } else if (data.status === 'processing') {
                    // Update progress UI
                    if (data.frames) {
                        const framesDone = data.frames;
                        // Use a simple heuristic for progress: assume ~300 frames for 10s video
                        // or just show frame count to show it's alive
                        const progressVal = Math.min(95, (framesDone / 300) * 100);
                        progress.style.width = `${progressVal}%`;
                        uploadStatus.querySelector('p').textContent = `AI is analyzing... ${framesDone} frames processed`;
                    }
                    if (isProcessing) setTimeout(() => pollStatus(taskId), 2000);
                }
            } catch (e) {
                console.error('Status poll error:', e);
                if (isProcessing) setTimeout(() => pollStatus(taskId), 5000);
            }
        };

        const completeAnalysis = (taskId) => {
            progress.style.width = '100%';
            const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:5001` : '';
            const videoUrl = `${apiBase}/assets/processed/${taskId}/output.mp4`;

            // Preload video
            const testVideo = document.createElement('video');
            testVideo.src = videoUrl;

            testVideo.oncanplay = () => {
                setTimeout(() => {
                    demoVideo.src = videoUrl;
                    demoVideo.load();
                    demoVideo.play().catch(e => {
                        console.log('Video autoplay prevented:', e);
                    });

                    uploadStatus.classList.add('hidden');
                    reloadBtn.classList.remove('hidden');

                    // Show completion message
                    const completionMsg = document.createElement('div');
                    completionMsg.className = 'completion-message';
                    completionMsg.innerHTML = '✅ Analysis Complete! Check the video above and gallery below.';
                    completionMsg.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: linear-gradient(135deg, #4ade80, #22c55e);
                        color: white;
                        padding: 15px 20px;
                        border-radius: 10px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                        z-index: 1000;
                        font-weight: 600;x
                        animation: slideInRight 0.5s ease;
                    `;
                    document.body.appendChild(completionMsg);

                    setTimeout(() => {
                        if (completionMsg.parentNode) {
                            completionMsg.remove();
                        }
                    }, 5000);
                }, 1000);
            };

            testVideo.onerror = () => {
                console.error('Video failed to load');
                alert('Analysis completed but video failed to load. Please check the console.');
                resetUI();
            };
        };

        try {
            const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:5001` : '';
            const response = await fetch(`${apiBase}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Upload response:', data);

            if (data.success) {
                const taskId = data.task_id;
                console.log('Task ID:', taskId);

                // Start polling for frames and status
                pollFrames(taskId);
                pollStatus(taskId);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
            resetUI();
        }
    }

    async function simulateProcessing(file) {
        // 1. Show loading state
        let progressVal = 0;
        uploadStatus.querySelector('p').textContent = "Loading Browser AI Model... (Running locally)";
        progress.style.width = '20%';

        try {
            // Load COCO-SSD model
            const model = await cocoSsd.load();
            progress.style.width = '50%';

            // Prepare Video
            const videoUrl = URL.createObjectURL(file);
            demoVideo.src = videoUrl;

            // Create Overlay Canvas
            let canvas = document.getElementById('demo-canvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'demo-canvas';
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.pointerEvents = 'none';
                canvas.style.zIndex = '10';
                // Make sure video container is relative
                demoVideo.parentNode.style.position = 'relative';
                demoVideo.parentNode.appendChild(canvas);
            }
            const ctx = canvas.getContext('2d');

            demoVideo.onloadeddata = () => {
                progress.style.width = '100%';
                uploadStatus.classList.add('hidden');
                reloadBtn.classList.remove('hidden');
                demoVideo.play();

                // Adjust canvas to match video dimensions
                canvas.width = demoVideo.clientWidth;
                canvas.height = demoVideo.clientHeight;

                // Remove existing overlay explanation
                const oldOverlay = demoVideo.parentNode.querySelector('div[style*="border-left"]');
                if (oldOverlay) oldOverlay.remove();

                // Add New Overlay Explanation
                const demoOverlay = document.createElement('div');
                demoOverlay.style.cssText = `
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    pointer-events: none;
                    z-index: 20;
                    border-left: 4px solid #3b82f6;
                `;
                demoOverlay.innerHTML = '<strong>DEMO MODE:</strong><br>Simulating PPE Checks...';
                demoVideo.parentNode.appendChild(demoOverlay);

                detectFrame(model, demoVideo, ctx, canvas);
            };

        } catch (e) {
            console.error("Browser AI failed", e);
            alert("Could not load browser AI. Playing raw video.");
            demoVideo.src = URL.createObjectURL(file);
            demoVideo.play();
            uploadStatus.classList.add('hidden');
        }
    }

    let lastSnapshotTime = 0;

    function detectFrame(model, video, ctx, canvas) {
        if (video.paused || video.ended) return;

        // Match canvas size to video display size if changed
        if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
            canvas.width = video.clientWidth;
            canvas.height = video.clientHeight;
        }

        model.detect(video).then(predictions => {
            // Clear previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Scaling factors
            const scaleX = canvas.width / video.videoWidth;
            const scaleY = canvas.height / video.videoHeight;

            let hasPerson = false;
            let detectedViolations = 0;

            predictions.forEach(prediction => {
                if (prediction.class === 'person') {
                    hasPerson = true;
                    // Randomized Simulation Logic
                    // Use bbox coordinates to create a consistent hash for "pseudo-random" safety
                    // This way a person stays safe/unsafe usually
                    const idSum = Math.floor(prediction.bbox[0] + prediction.bbox[1]);
                    const isUnsafe = (idSum % 10) > 6; // 30% chance of unsafe

                    const color = isUnsafe ? '#ff4444' : '#00ff00'; // Red or Green
                    const label = isUnsafe ? 'NO PPE DETECTED' : 'PPE OK';

                    if (isUnsafe) detectedViolations++;

                    // Scale bounding box
                    const x = prediction.bbox[0] * scaleX;
                    const y = prediction.bbox[1] * scaleY;
                    const w = prediction.bbox[2] * scaleX;
                    const h = prediction.bbox[3] * scaleY;

                    // Draw Bounding Box
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 4;
                    ctx.strokeRect(x, y, w, h);

                    // Draw Label Background
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y - 25, 140, 25);

                    // Draw Label Text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px sans-serif';
                    ctx.fillText(label, x + 5, y - 7);
                }
            });

            // --- Gallery Snapshot Logic ---
            // Capture frame if we found people (every 2.5 seconds)
            const now = Date.now();
            if (hasPerson && (now - lastSnapshotTime > 2500)) {
                lastSnapshotTime = now;
                const galleryGrid = document.querySelector('.gallery-grid');

                // create distinct canvas for snapshot
                const snapCanvas = document.createElement('canvas');
                snapCanvas.width = 300;
                snapCanvas.height = 200;
                const snapCtx = snapCanvas.getContext('2d');

                // Draw video frame
                snapCtx.drawImage(video, 0, 0, 300, 200);

                // Draw overlay (bounding boxes)
                snapCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 300, 200);

                const item = document.createElement('div');
                item.className = 'gallery-item glass-card visible fade-in';
                const timeStr = new Date().toLocaleTimeString();

                item.innerHTML = `
                    <img src="${snapCanvas.toDataURL()}" alt="Simulated Detection">
                    <div class="overlay"><span>Scanned: ${timeStr}</span></div>
                `;

                // Lightbox
                item.addEventListener('click', () => {
                    const overlay = document.createElement('div');
                    overlay.style.position = 'fixed';
                    overlay.style.inset = '0';
                    overlay.style.background = 'rgba(0,0,0,0.9)';
                    overlay.style.display = 'flex';
                    overlay.style.alignItems = 'center';
                    overlay.style.justifyContent = 'center';
                    overlay.style.zIndex = '1000';
                    overlay.style.cursor = 'zoom-out';

                    const img = document.createElement('img');
                    img.src = snapCanvas.toDataURL();
                    img.style.maxWidth = '90%';
                    img.style.maxHeight = '90%';

                    overlay.appendChild(img);
                    overlay.onclick = () => overlay.remove();
                    document.body.appendChild(overlay);
                });

                galleryGrid.prepend(item);

                // Keep gallery clean
                if (galleryGrid.children.length > 20) {
                    galleryGrid.removeChild(galleryGrid.children[20]);
                }
            }

            requestAnimationFrame(() => detectFrame(model, video, ctx, canvas));
        });
    }

    const resetUI = () => {
        uploadStatus.classList.add('hidden');
        fileInfo.classList.add('hidden');
        dropZone.classList.remove('hidden');
        progress.style.width = '0%';
        selectedFile = null;
        videoUpload.value = '';
    };

    const showLightbox = (imageSrc) => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.9)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1000';
        overlay.style.cursor = 'zoom-out';
        overlay.style.backdropFilter = 'blur(10px)';

        const fullImg = document.createElement('img');
        fullImg.src = imageSrc;
        fullImg.style.maxWidth = '90%';
        fullImg.style.maxHeight = '90%';
        fullImg.style.borderRadius = '1rem';
        fullImg.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';

        overlay.appendChild(fullImg);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    };

    analyzeBtn.addEventListener('click', () => {
        if (selectedFile) {
            handleUpload(selectedFile);
        }
    });

    // Add CSS animations
    const animationStyle = document.createElement('style');
    animationStyle.textContent += `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeInUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .drag-over {
            border-color: #4ade80 !important;
            background: rgba(74, 222, 128, 0.1) !important;
        }
    `;
    document.head.appendChild(animationStyle);

});
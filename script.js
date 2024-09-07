function selectScreen() {
    const displayMediaOptions = {
        video: {
            displaySurface: "browser",
        },
        audio: {
            suppressLocalAudioPlayback: false,
        },
        preferCurrentTab: false,
        selfBrowserSurface: "exclude",
        systemAudio: "include",
        surfaceSwitching: "include",
        monitorTypeSurfaces: "include",
    };
    startCapture(displayMediaOptions);
}

async function startCapture(displayMediaOptions) {
    try {
        const captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

        // Get video track from captureStream
        const videoTrack = captureStream.getVideoTracks()[0];

        // Create a video element to play the stream
        const videoElement = document.createElement('video');
        videoElement.srcObject = new MediaStream([videoTrack]);
        videoElement.autoplay = true;
        document.body.appendChild(videoElement);

        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        document.body.appendChild(canvas);

        // Variables for black screen detection
        let lastImageData;
        let blackScreenTimeout;
        const BLACK_SCREEN_TIMEOUT_DURATION = 5000; // 5 seconds

        // Variables for video recording
        let mediaRecorder;
        let recordedChunks = [];

        // Draw video frames onto the canvas
        function drawFrame() {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            // Check if canvas is black
            const isBlack = isCanvasBlack(imageData);

            if (isBlack) {
                if (!lastImageData) {
                    lastImageData = imageData;
                    blackScreenTimeout = setTimeout(handleBlackScreen, BLACK_SCREEN_TIMEOUT_DURATION);
                } else {
                    for (let i = 0; i < imageData.length; i++) {
                        if (imageData[i] !== lastImageData[i]) {
                            clearTimeout(blackScreenTimeout);
                            lastImageData = imageData;
                            blackScreenTimeout = setTimeout(handleBlackScreen, BLACK_SCREEN_TIMEOUT_DURATION);
                            break;
                        }
                    }
                }
            } else {
                clearTimeout(blackScreenTimeout);
                lastImageData = null;
            }

            requestAnimationFrame(drawFrame);
        }

        // Function to check if canvas is black
        function isCanvasBlack(imageData) {
            for (let i = 0; i < imageData.length; i += 4) {
                if (imageData[i] !== 0 || imageData[i + 1] !== 0 || imageData[i + 2] !== 0) {
                    return false;
                }
            }
            return true;
        }

        // Function to handle black screen detected
        function handleBlackScreen() {
            console.log('Black screen detected. Stopping stream...');
            stopStream();
        }

        // Function to start video recording
        function startRecording() {
            mediaRecorder = new MediaRecorder(captureStream);
            mediaRecorder.ondataavailable = function(event) {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            mediaRecorder.start();
            console.log('Recording started...');
        }

        // Function to stop video recording
        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                console.log('Recording stopped...');
            }
        }

        // Function to stop stream and download recorded video
        function stopStream() {
            stopRecording();

            // Stop video element and remove it
            videoElement.pause();
            videoElement.srcObject = null;
            videoElement.remove();

            // Stop canvas
            canvas.remove();

            // Download recorded video
            downloadRecordedVideo();
        }

        // Function to download recorded video
        function downloadRecordedVideo() {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'recorded_video.webm';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        }

        // Start recording
        startRecording();

        // Start drawing frames
        drawFrame();

        return captureStream;
    } catch (err) {
        console.error(`Error: ${err}`);
    }
}

// Call the function manually when needed
// selectScreen();

function selectScreen() {
    const displayMediaOptions = {
        video: {
            displaySurface: "browser",
        },
        audio: {
            suppressLocalAudioPlayback: true,
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
        window.captureStream = captureStream;
        setTimeout(() => { startRecording() }, 1000)
        // Create a video element to play the stream
        const videoElement = document.createElement('video');
        videoElement.srcObject = captureStream;
        videoElement.autoplay = true;
        document.body.appendChild(videoElement);


        // Function to stop stream and download recorded video with overlay
        function stopStream() {
            videoElement.pause();
            videoElement.srcObject = null;
            videoElement.remove();
        }
        // Listen for the stream end event
        videoElement.onended = () => {
            console.log('Stream ended. Stopping...');
            stopStream();
        };

        // Return the capture stream
        return captureStream;
    } catch (err) {
        console.error(`Error: ${err}`);
    }
}

// Call the function manually when needed
// selectScreen();
let captureStream = null;
let mediaRecorder = null;
let recordedChunks = [];

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const overlayTextInput = document.getElementById('overlay-text');
const applyOverlayBtn = document.getElementById('apply-overlay');
const startRecordingBtn = document.getElementById('start-recording');
const stopRecordingBtn = document.getElementById('stop-recording');

// Apply the overlay text to the video
applyOverlayBtn.addEventListener('click', () => {
    const overlayText = overlayTextInput.value;
    overlay.innerText = overlayText;
    overlay.classList.add('bl')
});

// Start recording video
function startRecording() {
    if (window.captureStream) {
        mediaRecorder = new MediaRecorder(window.captureStream);
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.start();
        console.log('Recording started...');
    } else {
        console.error('No capture stream available.');
    }
}

// Stop recording video
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log('Recording stopped...');
    }
    loader(5000)
    window.captureStream.getTracks().forEach(track => track.stop())
    setTimeout(()=>{downloadRecordedVideoWithOverlay()},5000)
}

// Loader
function loader(ms) {
    document.getElementById('loader').classList.add('show')
    setTimeout(()=>{
        document.getElementById('loader').classList.remove('show')
    },ms)
}
// Function to download recorded video with overlay
function downloadRecordedVideoWithOverlay() {
    // Combine recorded video chunks into a single Blob
    const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });

    // Create a blob URL only if it's not already created
    var recordedBlobUrl = window.URL.createObjectURL(recordedBlob);

    // Simulate a click to trigger download
    var a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = 'recorded_video_with_overlay.webm';
    var recordedBlobUrl = window.URL.createObjectURL(recordedBlob);
    a.click();
    window.captureStream.getTracks()
}

dragElement(document.getElementById("overlay"));

function dragElement(elmnt) {
    var pos1 = innerWidth / 2, pos2 = innerHeight / 3, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "")) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(elmnt.id + "").onmousedown = dragMouseDown;
    } else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        elmnt.onmousedown = dragMouseDown;
    }
    elmnt.style.top = (elmnt.offsetTop + pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft + pos1) + "px";

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

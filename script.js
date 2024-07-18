let mediaRecorder;
let recordedChunks = [];
let stream;
let recordingBlob;

const screenRecordBtn = document.getElementById('screenRecordBtn');
const audioVideoBtn = document.getElementById('audioVideoBtn');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const stopBtn = document.getElementById('stopBtn');
const screenshotBtn = document.getElementById('screenshotBtn');
const preview = document.getElementById('preview');
const recordingPreview = document.getElementById('recordingPreview');
const screenshotPreview = document.getElementById('screenshotPreview');
const recordedVideo = document.getElementById('recordedVideo');
const downloadBtn = document.getElementById('downloadBtn');
const downloadScreenshotBtn = document.getElementById('downloadScreenshotBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');
//const includeAudioCheckbox = document.getElementById('includeAudio');
const nightModeToggle = document.getElementById('nightModeToggle');

screenRecordBtn.addEventListener('click', () => startRecording('screen'));
audioVideoBtn.addEventListener('click', () => startRecording('audioVideo'));
pauseResumeBtn.addEventListener('click', togglePauseResume);
stopBtn.addEventListener('click', stopRecording);
screenshotBtn.addEventListener('click', () => startScreenshot());
downloadBtn.addEventListener('click', downloadRecording);
downloadScreenshotBtn.addEventListener('click', downloadScreenshot);
nightModeToggle.addEventListener('click', toggleNightMode);

window.addEventListener('beforeunload', function (e) {
    if (!isPreviewEmpty()) {
        e.preventDefault();
        e.returnValue = '';
    }
});

async function startRecording(type) {
    if (!isPreviewEmpty()) {
        showConfirmModal(() => {
            clearPreviousRecording();
            initiateRecording(type);
        });
    } else {
        initiateRecording(type);
    }
}

async function initiateRecording(type) {
    try {
        switch (type) {
            case 'screen':
                const displayMediaOptions = {
                    video: true,
                    audio: true
                };
                stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
                
                // if (includeAudioCheckbox.checked && !stream.getAudioTracks().length) {
                //     showErrorModal("Audio capture was not possible. Recording video only.");
                // }
                break;
            case 'audioVideo':
                stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                break;
        }
        handleRecord(stream);
        setButtonStates(true);
    } catch (err) {
        console.error("Error: " + err);
        showErrorModal("An error occurred while trying to start the recording. Please make sure you've granted the necessary permissions.");
    }
}

function handleRecord(stream) {
    clearPreviousRecording();
    preview.srcObject = stream;
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        recordingBlob = new Blob(recordedChunks, {type: 'video/mp4'});
        recordedVideo.src = URL.createObjectURL(recordingBlob);
        recordingPreview.classList.remove('hidden');
    };

    mediaRecorder.start();
}

function togglePauseResume() {
    if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        pauseResumeBtn.textContent = 'Resume';
    } else if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        pauseResumeBtn.textContent = 'Pause';
    }
}

function stopRecording() {
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
    setButtonStates(false);
    preview.srcObject = null;
}

function startScreenshot() {
    if (!isPreviewEmpty()) {
        showConfirmModal(() => {
            clearPreviousRecording();
            takeScreenshot();
        });
    } else {
        takeScreenshot();
    }
}

async function takeScreenshot() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({video: true});
        const track = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        const screenshotImg = document.getElementById('screenshotImg');
        screenshotImg.src = canvas.toDataURL('image/png');
        screenshotPreview.classList.remove('hidden');
        recordingPreview.classList.add('hidden');
        track.stop();
    } catch (err) {
        console.error("Error taking screenshot:", err);
        showErrorModal("An error occurred while taking the screenshot. Please try again.");
    }
}

function downloadRecording() {
    if (recordingBlob) {
        const url = URL.createObjectURL(recordingBlob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = 'recording.mp4';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

function downloadScreenshot() {
    const screenshotImg = document.getElementById('screenshotImg');
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = screenshotImg.src;
    a.download = 'screenshot.png';
    a.click();
    document.body.removeChild(a);
}

function setButtonStates(isRecording) {
    screenRecordBtn.disabled = isRecording;
    audioVideoBtn.disabled = isRecording;
    pauseResumeBtn.disabled = !isRecording;
    stopBtn.disabled = !isRecording;
}

function clearPreviousRecording() {
    recordedChunks = [];
    recordingPreview.classList.add('hidden');
    screenshotPreview.classList.add('hidden');
    recordedVideo.src = '';
}

function isPreviewEmpty() {
    return recordingPreview.classList.contains('hidden') && screenshotPreview.classList.contains('hidden');
}

function showConfirmModal(onConfirm) {
    confirmModal.style.display = 'block';
    confirmYes.onclick = () => {
        confirmModal.style.display = 'none';
        onConfirm();
    };
    confirmNo.onclick = () => {
        confirmModal.style.display = 'none';
    };
}

function showErrorModal(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const errorOk = document.getElementById('errorOk');

    errorMessage.textContent = message;
    errorModal.style.display = 'block';

    errorOk.onclick = () => {
        errorModal.style.display = 'none';
    };
}

function toggleNightMode() {
    document.body.classList.toggle('night-mode');
    nightModeToggle.classList.toggle('night-mode');
    nightModeToggle.textContent = nightModeToggle.classList.contains('night-mode') ? '☀️' : '🌙';
}

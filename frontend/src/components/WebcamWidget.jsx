import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const WebcamWidget = ({ onReady, onError, onProctorEvent, previewOnly = false }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceStatus, setFaceStatus] = useState('loading'); // 'loading' | 'ok' | 'no_face' | 'multiple'
    const [micLevel, setMicLevel] = useState(0);

    // Track continuous violations
    const violationCountRef = useRef({ MISSING_FACE: 0, MULTIPLE_FACES: 0 });

    // Snapshot helper
    const captureSnapshot = useCallback(() => {
        if (!videoRef.current || !videoRef.current.readyState === 4) return null;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        // Mirror for consistency with preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/jpeg', 0.6); // 60% quality jpeg to save DB space
    }, []);

    // Load face-api models
    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                setModelsLoaded(true);
                console.log('✅ Face-API models loaded');
            } catch (err) {
                console.error("Failed to load face-api models", err);
                setErrorMsg("AI Models failed to load. Proctoring unavailable.");
            }
        };
        loadModels();
    }, []);

    // Face detection loop — REFINED with grace periods
    useEffect(() => {
        if (previewOnly || !modelsLoaded || !videoRef.current) return;

        const interval = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            try {
                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 })
                );

                const faceCount = detections.length;

                if (faceCount === 0) {
                    violationCountRef.current.MISSING_FACE++;
                    violationCountRef.current.MULTIPLE_FACES = 0;

                    // Logic:
                    // 1 detection (~1.5s): LOOK_AWAY (Orange)
                    // 3+ detections (~4.5s): NO_FACE (Red)
                    if (violationCountRef.current.MISSING_FACE === 1) {
                        setFaceStatus('no_face'); // Immediate visual change
                        onProctorEvent && onProctorEvent('LOOK_AWAY', {
                            consecutiveCount: violationCountRef.current.MISSING_FACE
                        });
                    } else if (violationCountRef.current.MISSING_FACE >= 3) {
                        setFaceStatus('no_face');
                        // Capture evidence on hard violation
                        const evidenceImage = captureSnapshot();
                        onProctorEvent && onProctorEvent('NO_FACE', {
                            consecutiveCount: violationCountRef.current.MISSING_FACE,
                            evidenceImage
                        });
                    }
                } else if (faceCount > 1) {
                    violationCountRef.current.MULTIPLE_FACES++;
                    violationCountRef.current.MISSING_FACE = 0;
                    setFaceStatus('multiple');

                    // Fire immediately and capture evidence
                    if (violationCountRef.current.MULTIPLE_FACES === 1) {
                        const evidenceImage = captureSnapshot();
                        onProctorEvent && onProctorEvent('MULTIPLE_FACES', {
                            count: faceCount,
                            evidenceImage
                        });
                    } else if (violationCountRef.current.MULTIPLE_FACES % 3 === 0) {
                        onProctorEvent && onProctorEvent('MULTIPLE_FACES', { count: faceCount });
                    }
                } else {
                    // Exactly 1 face — all good
                    violationCountRef.current.MISSING_FACE = 0;
                    violationCountRef.current.MULTIPLE_FACES = 0;
                    setFaceStatus('ok');
                }
            } catch (err) {
                console.error("Face detection error:", err);
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [modelsLoaded, previewOnly, onProctorEvent, captureSnapshot]);

    // Mic noise detection — LOWER threshold, fires more aggressively
    useEffect(() => {
        if (previewOnly || !stream) return;

        let audioContext;
        let analyser;
        let source;
        let interval;

        const setupAudio = async () => {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                let noiseCount = 0;

                interval = setInterval(() => {
                    analyser.getByteFrequencyData(dataArray);

                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length;
                    setMicLevel(Math.round(average));

                    // Lower threshold — normal speech is ~15-30
                    if (average > 15) {
                        noiseCount++;
                        // Fire after 2 consecutive seconds of noise, then every 3 seconds
                        if (noiseCount === 2 || (noiseCount > 2 && noiseCount % 3 === 0)) {
                            onProctorEvent && onProctorEvent('MIC_NOISE', {
                                volume: Math.round(average),
                                duration: noiseCount
                            });
                        }
                    } else {
                        noiseCount = 0;
                    }
                }, 1000);
            } catch (err) {
                console.error("Audio detection error:", err);
            }
        };

        setupAudio();

        return () => {
            if (interval) clearInterval(interval);
            if (audioContext) audioContext.close();
        };
    }, [previewOnly, stream, onProctorEvent]);

    // Start camera + mic
    useEffect(() => {
        let activeStream;

        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: !previewOnly
                });
                setStream(mediaStream);
                activeStream = mediaStream;

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

                if (onReady) onReady();
            } catch (err) {
                console.error("Error accessing media devices.", err);
                setErrorMsg("Camera/Microphone access denied or not available.");
                if (onError) onError(err);
            }
        };

        if (modelsLoaded || previewOnly) {
            startCamera();
        }

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [previewOnly, modelsLoaded, onReady, onError]);

    if (errorMsg) {
        return <div style={{ color: '#ff4444', padding: '1rem', textAlign: 'center' }}>{errorMsg}</div>;
    }

    // Status indicator color
    const statusColor = faceStatus === 'ok' ? '#00e676' :
        faceStatus === 'no_face' ? '#ff1744' :
            faceStatus === 'multiple' ? '#ff9100' :
                '#ffd740';

    const statusText = faceStatus === 'ok' ? '✓ Face Detected' :
        faceStatus === 'no_face' ? '✗ NO FACE DETECTED' :
            faceStatus === 'multiple' ? '⚠ MULTIPLE FACES' :
                '◌ Loading AI...';

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* AI Status Bar */}
            <div style={{
                backgroundColor: statusColor,
                color: faceStatus === 'ok' ? '#000' : '#fff',
                padding: '6px 12px',
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'center',
                letterSpacing: '0.5px',
                animation: faceStatus !== 'ok' && faceStatus !== 'loading' ? 'pulse-bg 1s infinite' : 'none'
            }}>
                {statusText}
            </div>

            {/* Webcam Feed */}
            <div style={{ position: 'relative' }}>
                {!modelsLoaded && !previewOnly && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: '#000', color: 'white', zIndex: 2
                    }}>
                        Loading AI Models...
                    </div>
                )}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)',
                        border: `3px solid ${statusColor}`
                    }}
                />
            </div>

            {/* Mic Level Indicator */}
            {!previewOnly && (
                <div style={{ padding: '6px 12px', backgroundColor: '#1a1a2e' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '12px', color: '#aaa'
                    }}>
                        <span>🎤</span>
                        <div style={{
                            flex: 1, height: '6px', backgroundColor: '#333',
                            borderRadius: '3px', overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(micLevel * 3, 100)}%`,
                                backgroundColor: micLevel > 15 ? '#ff1744' : '#00e676',
                                transition: 'width 0.3s, background-color 0.3s'
                            }} />
                        </div>
                        <span style={{ color: micLevel > 15 ? '#ff1744' : '#888', fontWeight: micLevel > 15 ? 'bold' : 'normal' }}>
                            {micLevel > 15 ? 'NOISE!' : 'Quiet'}
                        </span>
                    </div>
                </div>
            )}

            {/* CSS Animation */}
            <style>{`
                @keyframes pulse-bg {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default WebcamWidget;

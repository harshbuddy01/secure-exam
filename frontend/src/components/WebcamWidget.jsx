import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const WebcamWidget = ({ onReady, onError, onProctorEvent, previewOnly = false }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Track continuous violations to avoid spamming the log
    const violationCountRef = useRef({ NO_FACE: 0, MULTIPLE_FACES: 0 });

    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                setModelsLoaded(true);
            } catch (err) {
                console.error("Failed to load face-api models", err);
            }
        };
        loadModels();
    }, []);

    useEffect(() => {
        if (previewOnly || !modelsLoaded || !videoRef.current) return;

        const interval = setInterval(async () => {
            // Don't detect if video is basically not ready/playing
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            const detections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
            );

            const faceCount = detections.length;

            if (faceCount === 0) {
                violationCountRef.current.NO_FACE++;
                if (violationCountRef.current.NO_FACE === 3) {
                    onProctorEvent && onProctorEvent('NO_FACE');
                }
            } else {
                violationCountRef.current.NO_FACE = 0;
            }

            if (faceCount > 1) {
                violationCountRef.current.MULTIPLE_FACES++;
                if (violationCountRef.current.MULTIPLE_FACES === 2) {
                    onProctorEvent && onProctorEvent('MULTIPLE_FACES', { count: faceCount });
                }
            } else {
                violationCountRef.current.MULTIPLE_FACES = 0;
            }

        }, 2000); // Check every 2 seconds to reduce CPU and fix performance issue

        return () => clearInterval(interval);
    }, [modelsLoaded, previewOnly, onProctorEvent]);

    const handleVideoPlay = () => {
        // Left empty if we don't need this hook anymore since the useEffect handles the timer
    };

    useEffect(() => {
        let activeStream;

        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !previewOnly });
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
        return <div style={{ color: 'var(--danger)', padding: '1rem', textAlign: 'center' }}>{errorMsg}</div>;
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!modelsLoaded && !previewOnly && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: 'white', zIndex: 2 }}>
                    Loading AI Models...
                </div>
            )}
            <video
                ref={videoRef}
                onPlay={handleVideoPlay}
                autoPlay
                playsInline
                muted
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)'
                }}
            />
        </div>
    );
};

export default WebcamWidget;

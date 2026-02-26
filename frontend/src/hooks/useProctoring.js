import { useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const THROTTLE_MS = 3000; // 3 seconds between identical event types

const useProctoring = (examId, isExamActive) => {
    const lastLoggedRef = useRef({});

    const logEvent = useCallback(async (eventType, metadata = {}) => {
        if (!isExamActive || !examId) return;

        const now = Date.now();
        const lastTime = lastLoggedRef.current[eventType] || 0;

        // Throttle identical event types to avoid network spam (Kluster P4.3)
        if (now - lastTime < THROTTLE_MS) {
            return;
        }

        lastLoggedRef.current[eventType] = now;

        try {
            await axios.post('http://localhost:5001/api/proctor/log', {
                examId,
                eventType,
                metadata
            });
            console.warn(`Proctor Event Logged: ${eventType}`);
        } catch (err) {
            console.error('Failed to log proctor event', err);
        }
    }, [examId, isExamActive]);

    useEffect(() => {
        if (!isExamActive) return;

        // 1. Tab Switching (Visibility API)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                logEvent('TAB_SWITCH', { timestamp: Date.now() });
                alert("Warning: Switching tabs is not allowed during the exam. This action has been recorded.");
            }
        };

        // 2. Window Blur (Leaving the window)
        const handleWindowBlur = () => {
            logEvent('TAB_SWITCH', { type: 'window_blur', timestamp: Date.now() });
        };

        // 3. Right Click (Context Menu)
        const handleContextMenu = (e) => {
            e.preventDefault();
            // Optional: logEvent('RIGHT_CLICK', { x: e.clientX, y: e.clientY });
        };

        // 4. Copying text
        const handleCopy = (e) => {
            e.preventDefault();
            // Optional: logEvent('COPY_ATTEMPT');
        };

        // 5. Fullscreen exiting
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                logEvent('FULLSCREEN_EXIT');
                alert("Warning: You must remain in fullscreen mode.");
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Initial fullscreen request if not already and if a user interaction has occurred
        // Browsers block automatic fullscreen requests, usually trigger it on a button click
        const enforceFullscreen = () => {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log("Could not Auto-enter fullscreen, expecting user click", err);
                });
            }
        };

        // Attempt immediately, might fail until user interacts
        enforceFullscreen();
        // Add click listener to enforce it anywhere they click
        document.addEventListener('click', enforceFullscreen, { once: true });

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('click', enforceFullscreen);

            // Exit fullscreen when component unmounts
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(e => console.error(e));
            }
        };
    }, [isExamActive, logEvent]);

    return { logEvent };
};

export default useProctoring;

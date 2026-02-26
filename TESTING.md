# Proctoring Engine Testing Guide

Use these scenarios to verify the anti-cheating mechanisms of the Secure Exam Platform.

## 1. Normal/Clean Attempt
1. Login as a student.
2. Enter an Exam ID and stay in fullscreen.
3. Keep your face visible and remain quiet.
4. Complete the exam and submit.
5. **Expected Result**: Admin dashboard shows "SAFE" risk and 0 suspicion score.

## 2. Low/Medium Suspicion
1. Start the exam.
2. Briefly switch tabs or exit fullscreen (trigger `TAB_SWITCH` or `FULLSCREEN_EXIT`).
3. Make some loud continuous noise for > 3 seconds (trigger `MIC_NOISE`).
4. **Expected Result**: Admin dashboard shows "SUSPICIOUS" risk and a low positive suspicion score.

## 3. High Risk Attempt
1. Start the exam.
2. Hide your face from the camera for several seconds (trigger `NO_FACE`).
3. Bring a second person into the camera frame (trigger `MULTIPLE_FACES`).
4. Repeatedly switch tabs.
5. **Expected Result**: Admin dashboard shows "HIGH_RISK" and a high suspicion score.

## 🛠️ Simulating Data
If you don't want to perform the actions, you can manually trigger events by modifying the frontend code or hitting the `/api/proctor/log` endpoint directly with a valid JWT and active `examId`.

import express from 'express';
import { processSubmission, startExam } from '../services/submission.service.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/start', protect, async (req, res) => {
    try {
        const submission = await startExam(req.user._id, req.body.examId);
        res.status(201).json(submission);
    } catch (error) {
        if (error.message === 'Exam not found') {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const submission = await processSubmission(req.user._id, req.body);
        res.status(200).json(submission);
    } catch (error) {
        if (error.message === 'Exam not found' || error.message === 'No active exam attempt found') {
            res.status(404).json({ message: error.message });
        } else if (error.message.includes('Submission rejected')) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});

export default router;

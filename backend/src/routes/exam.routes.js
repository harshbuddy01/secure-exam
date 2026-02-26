import express from 'express';
import { getExamById } from '../services/exam.service.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get exam details & questions (protected route, student or admin)
router.get('/:examId', protect, async (req, res) => {
    try {
        const data = await getExamById(req.params.examId);
        res.json(data);
    } catch (error) {
        if (error.message === 'Exam not found') {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});

export default router;

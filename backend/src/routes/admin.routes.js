import express from 'express';
import { generateAttemptReport } from '../services/admin.service.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/attempt/:attemptId/report', protect, adminOnly, async (req, res) => {
    try {
        const report = await generateAttemptReport(req.params.attemptId, req.user._id);
        res.json(report);
    } catch (error) {
        if (error.message === 'Attempt not found') {
            res.status(404).json({ message: error.message });
        } else if (error.message === 'Unauthorized to view this attempt report') {
            res.status(403).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});

export default router;

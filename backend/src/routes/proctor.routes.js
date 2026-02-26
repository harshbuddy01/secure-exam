import express from 'express';
import rateLimit from 'express-rate-limit';
import { logProctorEvent } from '../services/proctor.service.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const proctorLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // allow 1 event per second roughly
    message: { message: 'Too many proctor events, please slow down' }
});

router.post('/log', protect, proctorLimiter, async (req, res) => {
    try {
        const log = await logProctorEvent(req.user._id, req.body);
        res.status(201).json(log);
    } catch (error) {
        if (error.message === 'Invalid proctor event type') {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});

export default router;

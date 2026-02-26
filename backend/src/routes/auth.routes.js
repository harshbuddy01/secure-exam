import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser } from '../services/auth.service.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

router.post('/register', authLimiter, async (req, res) => {
    try {
        const user = await registerUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        if (error.message === 'User already exists') {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});

router.post('/login', authLimiter, async (req, res) => {
    try {
        const user = await loginUser(req.body);
        res.json(user);
    } catch (error) {
        if (error.message === 'Invalid email or password') {
            res.status(401).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, (req, res) => {
    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
    });
});

export default router;

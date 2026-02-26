import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import examRoutes from './src/routes/exam.routes.js';
import submissionRoutes from './src/routes/submission.routes.js';
import proctorRoutes from './src/routes/proctor.routes.js';
import adminRoutes from './src/routes/admin.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/submission', submissionRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Secure Exam Server running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

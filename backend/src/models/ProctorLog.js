import mongoose from 'mongoose';

const proctorLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
    eventType: { type: String, required: true }, // TAB_SWITCH, FULLSCREEN_EXIT, NO_FACE, MULTIPLE_FACES, MIC_NOISE
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed }, // Useful for face counts, audio levels, etc.
    evidenceImage: { type: String } // Optional base64 image capture
});

export default mongoose.model('ProctorLog', proctorLogSchema);

import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    durationMinutes: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Exam', examSchema);

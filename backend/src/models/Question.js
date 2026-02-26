import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true }, // Index of the correct option
    marks: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);

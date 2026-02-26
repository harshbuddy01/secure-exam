import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedIndex: { type: Number, required: true }
    }],
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    marksScore: { type: Number, default: 0 },
    status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED'], default: 'IN_PROGRESS' }
}, { timestamps: true });

submissionSchema.index({ userId: 1, examId: 1, status: 1 });

export default mongoose.model('Submission', submissionSchema);

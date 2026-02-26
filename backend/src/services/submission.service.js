import Submission from '../models/Submission.js';
import Question from '../models/Question.js';
import Exam from '../models/Exam.js';

// Pure function for scoring
export const calculateScore = (answers, questions) => {
    const questionMap = {};
    questions.forEach(q => {
        questionMap[q._id.toString()] = q;
    });

    let totalMarks = 0;
    answers.forEach(answer => {
        const q = questionMap[answer.questionId];
        if (q && answer.selectedIndex === q.correctIndex) {
            totalMarks += q.marks;
        }
    });

    return totalMarks;
};

export const startExam = async (userId, examId) => {
    const exam = await Exam.findById(examId);
    if (!exam) {
        throw new Error('Exam not found');
    }

    // Check for an existing in-progress submission
    let submission = await Submission.findOne({ userId, examId, status: 'IN_PROGRESS' });
    if (!submission) {
        submission = await Submission.create({
            examId,
            userId,
            answers: [],
            startTime: new Date(),
            marksScore: 0,
            status: 'IN_PROGRESS'
        });
    }
    return submission;
};

export const processSubmission = async (userId, submissionData) => {
    const { examId, answers } = submissionData;

    const exam = await Exam.findById(examId);
    if (!exam) {
        throw new Error('Exam not found');
    }

    // Find the in-progress submission to get the secure server-side start time
    const submission = await Submission.findOne({ userId, examId, status: 'IN_PROGRESS' }).sort({ createdAt: -1 });
    if (!submission) {
        throw new Error('No active exam attempt found');
    }

    const serverEndTime = new Date();
    const durationMs = serverEndTime.getTime() - submission.startTime.getTime();
    const allowedMs = (exam.durationMinutes + 5) * 60 * 1000; // 5 mins buffer

    if (durationMs > allowedMs) {
        throw new Error('Submission rejected: Time limit exceeded');
    }

    const questions = await Question.find({ examId });
    const totalMarks = calculateScore(answers, questions);

    submission.answers = answers;
    submission.endTime = serverEndTime;
    submission.marksScore = totalMarks;
    submission.status = 'SUBMITTED';

    await submission.save();
    return submission;
};

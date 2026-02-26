import Exam from '../models/Exam.js';
import Question from '../models/Question.js';

export const getExamById = async (examId) => {
    const exam = await Exam.findById(examId);
    if (!exam) {
        throw new Error('Exam not found');
    }

    // Fetch questions for this exam
    const questions = await Question.find({ examId });

    // Map out the correct answers before sending to the client
    // Randomizing options is optional but requested, however, we must ensure
    // correctIndex lines up if we randomize. For simplicity and reliability,
    // we just strip correctIndex out here.
    const secureQuestions = questions.map(q => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        marks: q.marks
    }));

    return {
        exam: {
            _id: exam._id,
            title: exam.title,
            durationMinutes: exam.durationMinutes,
            totalMarks: exam.totalMarks
        },
        questions: secureQuestions
    };
};

import ProctorLog from '../models/ProctorLog.js';
import Submission from '../models/Submission.js';

export const logProctorEvent = async (userId, body) => {
    const { examId, attemptId, eventType, metadata } = body;

    const validEvents = [
        'TAB_SWITCH',
        'FULLSCREEN_EXIT',
        'NO_FACE',
        'MULTIPLE_FACES',
        'MIC_NOISE'
    ];

    if (!validEvents.includes(eventType)) {
        throw new Error('Invalid proctor event type');
    }

    // Validate the user has an active submission for this exam
    const submission = await Submission.findOne({ userId, examId, status: 'IN_PROGRESS' }).select('_id status');
    if (!submission) {
        throw new Error('No active exam session found for proctor logging');
    }

    // Validate metadata structure (prevent deep/massive objects without stringify)
    if (metadata && typeof metadata === 'object') {
        const keys = Object.keys(metadata);
        if (keys.length > 20) {
            throw new Error('Metadata payload has too many fields');
        }
    }

    // Create the log entry. For extreme scale, batch insertions or a Redis buffer should be used here.
    const log = await ProctorLog.create({
        userId,
        examId,
        attemptId: submission._id,
        eventType,
        metadata,
        evidenceImage: body.evidenceImage
    });

    return log;
};

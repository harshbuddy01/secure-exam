import Submission from '../models/Submission.js';
import ProctorLog from '../models/ProctorLog.js';
import { loadProctorRules } from '../config/proctorRules.js';

const calculateProctoringSummary = (eventCounts, proctorRules) => {
    let totalSuspicionScore = 0;

    Object.entries(eventCounts).forEach(([type, count]) => {
        totalSuspicionScore += (proctorRules[type] || 0) * count;
    });

    let riskLabel = 'SAFE';
    if (totalSuspicionScore >= 50) {
        riskLabel = 'HIGH_RISK';
    } else if (totalSuspicionScore >= 20) {
        riskLabel = 'SUSPICIOUS';
    }

    return { totalSuspicionScore, riskLabel, eventCounts };
};

export const generateAttemptReport = async (attemptId, adminId) => {
    const proctorRules = await loadProctorRules();
    const submission = await Submission.findById(attemptId)
        .populate('examId')
        .populate('userId', '-password');

    if (!submission) {
        throw new Error('Attempt not found');
    }

    // Strict object-level authorization: ensure the admin requesting the report is the creator of the exam
    if (!submission.examId.createdBy || submission.examId.createdBy.toString() !== adminId.toString()) {
        throw new Error('Unauthorized to view this attempt report');
    }

    // Optimize log fetching: Instead of returning all logs, count them by type.
    const aggResult = await ProctorLog.aggregate([
        { $match: { attemptId: submission._id } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);

    const eventCounts = {};
    aggResult.forEach(item => {
        eventCounts[item._id] = item.count;
    });

    const proctoringSummary = calculateProctoringSummary(eventCounts, proctorRules);

    // Prevent unbounded memory growth by limiting timeline logs.
    // In a full production system, provide a separate paginated endpoint for deep timeline traversal.
    const timeline = await ProctorLog.find({ attemptId: submission._id })
        .sort({ timestamp: -1 }) // get newest first
        .limit(100)
        .select('-__v -updatedAt');

    return {
        student: submission.userId,
        exam: submission.examId,
        attemptDetails: {
            startTime: submission.startTime,
            endTime: submission.endTime,
            marksScore: submission.marksScore,
            status: submission.status,
        },
        proctoringSummary,
        timeline: timeline.reverse() // restore chronological order for the UI
    };
};

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import WebcamWidget from '../components/WebcamWidget';
import useProctoring from '../hooks/useProctoring';
import './Exam.css';

const Exam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [examState, setExamState] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/exam/${examId}`);
                setExamState(response.data.exam);
                setQuestions(response.data.questions);
                setTimeLeft(response.data.exam.durationMinutes * 60);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load exam", err);
                // Fallback or error handling
            }
        };
        fetchExam();
    }, [examId]);

    const { logEvent } = useProctoring(examId, true);

    const handleWebcamProctorEvent = useCallback((type, meta) => {
        logEvent(type, meta);
        if (type === 'NO_FACE') {
            alert('Warning: No face detected in the camera frame. Please remain visible.');
        } else if (type === 'MULTIPLE_FACES') {
            alert('Warning: Multiple faces detected. You must be alone during the exam.');
        } else if (type === 'MIC_NOISE') {
            alert('Warning: Excessive background noise detected. Please ensure a quiet environment.');
        }
    }, [logEvent]);

    const submitExam = useCallback(async (isAuto = false) => {
        if (submitting) return;
        setSubmitting(true);

        // Format answers for API: [{ questionId, selectedIndex }]
        const formattedAnswers = Object.keys(answers).map(qId => ({
            questionId: qId,
            selectedIndex: answers[qId]
        }));

        try {
            await axios.post('http://localhost:5000/api/submission', {
                examId,
                answers: formattedAnswers
            });
            // Redirect to success or dashboard
            navigate('/', { replace: true, state: { message: 'Exam submitted successfully' } });
        } catch (err) {
            console.error("Submission failed", err);
            alert('Failed to submit exam. Please try again or contact support.');
            setSubmitting(false);
        }
    }, [answers, examId, navigate, submitting]);

    // Timer logic
    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            if (!submitting) {
                submitExam(true);
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, submitExam, submitting]);

    const handleOptionSelect = (qId, index) => {
        setAnswers(prev => ({
            ...prev,
            [qId]: index
        }));
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) return <div className="loading-screen">Loading Exam Environment...</div>;

    return (
        <div className="exam-layout">
            {/* Left panel: Questions */}
            <div className="questions-panel">
                <header className="exam-header">
                    <h2>{examState.title}</h2>
                    <div className="timer-badge">
                        Time Left: {formatTime(timeLeft)}
                    </div>
                </header>

                <div className="questions-list">
                    {questions.map((q, qIndex) => (
                        <div key={q._id} className="card question-card">
                            <div className="question-header">
                                <h3>Question {qIndex + 1}</h3>
                                <span className="marks-badge">{q.marks} Marks</span>
                            </div>
                            <p className="question-text">{q.text}</p>

                            <div className="options-container">
                                {q.options.map((opt, optIndex) => (
                                    <label key={optIndex} className={`option-label ${answers[q._id] === optIndex ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name={`question_${q._id}`}
                                            checked={answers[q._id] === optIndex}
                                            onChange={() => handleOptionSelect(q._id, optIndex)}
                                        />
                                        <span className="option-text">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel: Proctoring + Submit */}
            <div className="proctor-panel">
                <div className="proctor-sticky">
                    <div className="webcam-container">
                        <div className="proctor-status">
                            <span className="status-dot recording"></span> Recording
                        </div>
                        <WebcamWidget onProctorEvent={handleWebcamProctorEvent} />
                    </div>

                    <div className="panel-actions">
                        <p className="progress-text">
                            Answered: {Object.keys(answers).length} / {questions.length}
                        </p>
                        <button
                            className="primary full-width submit-btn"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to completely finish and submit the exam?')) {
                                    submitExam();
                                }
                            }}
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Final Answer'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Exam;

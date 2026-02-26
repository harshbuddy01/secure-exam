import { useState, useEffect, useCallback, useRef } from 'react';
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

    // Proctoring state — persistent warnings
    const [violations, setViolations] = useState([]);
    const [violationCount, setViolationCount] = useState(0);
    const [activeWarning, setActiveWarning] = useState(null);
    const warningTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/exam/${examId}`);
                setExamState(response.data.exam);
                setQuestions(response.data.questions);
                setTimeLeft(response.data.exam.durationMinutes * 60);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load exam", err);
            }
        };
        fetchExam();
    }, [examId]);

    const { logEvent } = useProctoring(examId, true);

    const handleWebcamProctorEvent = useCallback((type, meta) => {
        logEvent(type, meta);

        setViolationCount(prev => prev + 1);

        // Build warning message
        let message = '';
        let severity = 'warning'; // 'warning' | 'danger'

        if (type === 'LOOK_AWAY') {
            message = '👀 Looking away? Please stay focused on the screen.';
            severity = 'warning';
        } else if (type === 'NO_FACE') {
            message = '🚫 NO FACE DETECTED — Look at the camera now!';
            severity = 'danger';
        } else if (type === 'MULTIPLE_FACES') {
            message = `👥 MULTIPLE FACES DETECTED (${meta?.count || 2}) — You must be ALONE!`;
            severity = 'danger';
        } else if (type === 'MIC_NOISE') {
            message = `🔊 TALKING/NOISE DETECTED (Level: ${meta?.volume || '?'}) — Stay SILENT!`;
            severity = 'warning';
        }

        const hasEvidence = !!meta?.evidenceImage;

        // Add to violations log
        const violation = {
            id: Date.now(),
            type,
            message,
            severity,
            time: new Date().toLocaleTimeString(),
            hasEvidence
        };
        setViolations(prev => [violation, ...prev].slice(0, 20));

        // Show persistent warning banner
        setActiveWarning({ message, severity });

        // Clear warning after 4 seconds (but it will re-trigger if violation continues)
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => {
            setActiveWarning(null);
        }, 4000);

    }, [logEvent]);

    const submitExam = useCallback(async (isAuto = false) => {
        if (submitting) return;
        setSubmitting(true);

        const formattedAnswers = Object.keys(answers).map(qId => ({
            questionId: qId,
            selectedIndex: answers[qId]
        }));

        try {
            await axios.post('http://localhost:5001/api/submission', {
                examId,
                answers: formattedAnswers
            });
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
            if (!submitting) submitExam(true);
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, submitExam, submitting]);

    const handleOptionSelect = (qId, index) => {
        setAnswers(prev => ({ ...prev, [qId]: index }));
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) return <div className="loading-screen">Loading Exam Environment...</div>;

    return (
        <div className="exam-layout">
            {/* === FULL-SCREEN WARNING BANNER === */}
            {activeWarning && (
                <div className={`warning-banner ${activeWarning.severity}`}>
                    <div className="warning-content">
                        <span className="warning-icon">⚠️</span>
                        <span className="warning-text">{activeWarning.message}</span>
                        <span className="warning-badge">Violation #{violationCount}</span>
                    </div>
                </div>
            )}

            {/* Left panel: Questions */}
            <div className="questions-panel">
                <header className="exam-header">
                    <h2>{examState.title}</h2>
                    <div className="header-right">
                        {violationCount > 0 && (
                            <div className={`violation-counter ${violationCount >= 5 ? 'critical' : violationCount >= 3 ? 'warning' : ''}`}>
                                ⚠ {violationCount} Violation{violationCount !== 1 ? 's' : ''}
                            </div>
                        )}
                        <div className="timer-badge">
                            ⏱ {formatTime(timeLeft)}
                        </div>
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
                            <span className="status-dot recording"></span> AI Monitoring Active
                        </div>
                        <WebcamWidget onProctorEvent={handleWebcamProctorEvent} />
                    </div>

                    {/* Live Violations Log */}
                    {violations.length > 0 && (
                        <div className="violations-log">
                            <h4>📋 Detected Violations ({violationCount})</h4>
                            <div className="violations-list">
                                {violations.slice(0, 5).map(v => (
                                    <div key={v.id} className={`violation-entry ${v.severity}`}>
                                        <span className="v-time">{v.time}</span>
                                        <span className="v-type">{v.type} {v.hasEvidence && '📸'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="panel-actions">
                        <p className="progress-text">
                            Answered: {Object.keys(answers).length} / {questions.length}
                        </p>
                        <button
                            className="primary full-width submit-btn"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to submit the exam?')) {
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

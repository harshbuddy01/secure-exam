import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import WebcamWidget from '../components/WebcamWidget';
import './Instructions.css';

const Instructions = () => {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [cameraReady, setCameraReady] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // In a real app we'd fetch assigned exams. Here we can just mock or fetch a list of active exams.
    // For demo, we are assuming exam seed ID or fetching a list from an endpoint if it existed.
    // Since we don't have a GET /exams endpoint, we might just hardcode the seed exam ID or require input.

    // Actually, we need an endpoint to get active exams to select from. Let's add that to backend later, 
    // or just use a text input for Demo purposes to paste the Exam ID.

    const handleStart = async () => {
        if (!selectedExam) {
            setError('Please enter a valid Exam ID');
            return;
        }
        if (!cameraReady) {
            setError('Camera permission is required to start the exam');
            return;
        }

        try {
            // 1. Initialize submission to get active attempt
            await axios.post('http://localhost:5000/api/submission/start', { examId: selectedExam });
            navigate(`/exam/${selectedExam}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start exam');
        }
    };

    return (
        <div className="container instructions-container">
            <div className="card instructions-card">
                <h1>Exam Instructions</h1>

                <div className="rules-section">
                    <h3>Please read carefully before proceeding:</h3>
                    <ul>
                        <li>Ensure you are in a quiet, well-lit room.</li>
                        <li>Your webcam and microphone must remain active throughout the exam.</li>
                        <li>Do not switch tabs or exit fullscreen mode. This will be flagged.</li>
                        <li>No other faces should be visible in the camera frame.</li>
                        <li>Any suspicious activity will be logged and may result in disqualification.</li>
                    </ul>
                </div>

                <div className="setup-section">
                    <h3>Camera Setup</h3>
                    <p>Please allow camera access and ensure your face is clearly visible.</p>
                    <div className="webcam-preview border-rounded">
                        <WebcamWidget onReady={() => setCameraReady(true)} onError={() => setCameraReady(false)} previewOnly />
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="action-section">
                    <input
                        type="text"
                        placeholder="Enter Exam ID to begin"
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                        className="exam-input"
                    />
                    <button
                        className="primary"
                        onClick={handleStart}
                        disabled={!cameraReady || !selectedExam}
                    >
                        Start Exam
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Instructions;

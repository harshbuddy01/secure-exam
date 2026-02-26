import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AttemptReport.css';

const AttemptReport = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/admin/attempt/${attemptId}/report`);
                setReport(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load report');
                setLoading(false);
            }
        };
        fetchReport();
    }, [attemptId]);

    if (loading) return <div className="container">Loading Report...</div>;
    if (error) return <div className="container error-message">{error}</div>;

    const { student, exam, attemptDetails, proctoringSummary, timeline } = report;

    return (
        <div className="container report-container">
            <button className="back-btn" onClick={() => navigate('/admin')}>
                &larr; Back to Dashboard
            </button>

            <div className="report-header">
                <h1>Proctoring Report: {exam?.title}</h1>
                <p className="subtitle">Attempt by {student?.email}</p>
            </div>

            <div className="metrics-grid">
                <div className="card metric-card">
                    <h3>Score</h3>
                    <div className="metric-value">{attemptDetails?.marksScore} Marks</div>
                    <div className="metric-sub">Status: {attemptDetails?.status}</div>
                </div>

                <div className="card metric-card">
                    <h3>Suspicion Score</h3>
                    <div className={`metric-value risk-text ${proctoringSummary?.riskLabel.toLowerCase()}`}>
                        {proctoringSummary?.totalSuspicionScore}
                    </div>
                    <div className="metric-sub">Risk Level: {proctoringSummary?.riskLabel.replace('_', ' ')}</div>
                </div>

                <div className="card metric-card">
                    <h3>Time Tracking</h3>
                    <div className="metric-value">
                        {attemptDetails?.startTime ? new Date(attemptDetails.startTime).toLocaleTimeString() : 'N/A'}
                    </div>
                    <div className="metric-sub">
                        To: {attemptDetails?.endTime ? new Date(attemptDetails.endTime).toLocaleTimeString() : 'In Progress'}
                    </div>
                </div>
            </div>

            <div className="report-content">
                <div className="card timeline-card">
                    <h3>Event Timeline</h3>
                    {timeline && timeline.length > 0 ? (
                        <div className="timeline-list">
                            {timeline.map((event, i) => (
                                <div key={i} className="timeline-item">
                                    <div className="timeline-time">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </div>
                                    <div className="timeline-marker"></div>
                                    <div className="timeline-content">
                                        <span className="event-type">{event.eventType.replace('_', ' ')}</span>
                                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                                            <pre className="event-meta">{JSON.stringify(event.metadata, null, 2)}</pre>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-events">No suspicious events recorded during this session.</p>
                    )}
                </div>

                <div className="card summary-card">
                    <h3>Proctoring Summary</h3>
                    <ul className="summary-list">
                        {Object.entries(proctoringSummary?.eventCounts || {}).map(([type, count]) => (
                            <li key={type}>
                                <span className="summary-type">{type.replace('_', ' ')}</span>
                                <span className="summary-count badge">{count} Events</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AttemptReport;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

// Mock list or we could fetch from an endpoint. Since we didn't build a list submissions endpoint, 
// we will quickly mock the fetch or build a generic one. For a real app, GET /admin/attempts is needed.
// For now, I'll add a placeholder that we will wire up.

const AdminDashboard = () => {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // In a real application we would have a dedicated endpoint for this list.
    // For the sake of this implementation, we will mock the data fetch here 
    // until we add the backend route or if the user wants to test via database direct.
    useEffect(() => {
        // Simulating an API call to fetch attempts
        setTimeout(() => {
            setAttempts([
                { _id: 'mock-1', user: { email: 'student1@example.com' }, exam: { title: 'Midterm CS101' }, score: 85, risk: 'SAFE' },
                { _id: 'mock-2', user: { email: 'hacker@example.com' }, exam: { title: 'Midterm CS101' }, score: 95, risk: 'HIGH_RISK' },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return <div className="container">Loading Dashboard...</div>;

    return (
        <div className="container admin-container">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <p>Review student exam attempts and proctoring reports</p>
            </div>

            <div className="card list-card">
                <table className="attempts-table">
                    <thead>
                        <tr>
                            <th>StudentEmail</th>
                            <th>Exam</th>
                            <th>Score</th>
                            <th>Proctor Risk</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attempts.map(attempt => (
                            <tr key={attempt._id}>
                                <td>{attempt.user.email}</td>
                                <td>{attempt.exam.title}</td>
                                <td>{attempt.score}%</td>
                                <td>
                                    <span className={`risk-badge ${attempt.risk.toLowerCase()}`}>
                                        {attempt.risk.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="primary"
                                        onClick={() => navigate(`/admin/report/${attempt._id}`)}
                                    >
                                        View Report
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;

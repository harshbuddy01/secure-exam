import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import './index.css';

// Lazy loading or direct imports of pages (will create next)
import Login from './pages/Login';
import Instructions from './pages/Instructions';
import Exam from './pages/Exam';
import AdminDashboard from './pages/AdminDashboard';
import AttemptReport from './pages/AttemptReport';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Student Routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Instructions />
            </ProtectedRoute>
          } />
          <Route path="/exam/:examId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Exam />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/report/:attemptId" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AttemptReport />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

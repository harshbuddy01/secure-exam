import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    }, []);

    useEffect(() => {
        const verifyToken = async () => {
            if (token) {
                try {
                    // Set axios default header so requests succeed
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await axios.get('http://localhost:5001/api/auth/me');
                    setUser({ _id: response.data._id, role: response.data.role });
                } catch (err) {
                    console.error("Token verification failed", err);
                    logout();
                }
            } else {
                setUser(null);
                delete axios.defaults.headers.common['Authorization'];
            }
            setLoading(false);
        };

        verifyToken();
    }, [token, logout]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

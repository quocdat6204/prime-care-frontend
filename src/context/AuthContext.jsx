import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await userService.getMyInfo();
      const userData = res.data.result;
      setUser(userData);
      setRole(userData.role);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      if (err.response?.status === 401) {
        clearAuth();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    const savedUser = localStorage.getItem('user');
    if (savedRole && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setRole(savedRole);
      } catch { /* ignore parse errors */ }
    }
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { accessToken, refreshToken, role: userRole } = res.data.result;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('role', userRole);
    setRole(userRole);
    await fetchUser();
    return res.data;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    return res.data;
  };

  const verifyOtp = async (data) => {
    const res = await authService.verifyOtp(data);
    return res.data;
  };

  const generateOtp = async (data) => {
    const res = await authService.generateOtp(data);
    return res.data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setUser(null);
    setRole(null);
  };

  const updateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem('user', JSON.stringify(updatedData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        register,
        verifyOtp,
        generateOtp,
        logout,
        fetchUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

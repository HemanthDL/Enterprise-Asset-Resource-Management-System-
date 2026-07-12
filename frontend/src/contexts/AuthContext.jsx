import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/api/endpoints';
import { ROLES } from '@/constants/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Validate session on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.me()
        .then((res) => {
          setUser(res.data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authAPI.login(credentials);
    const { access_token } = res.data;
    localStorage.setItem('access_token', access_token);
    // Fetch user info
    const userRes = await authAPI.me();
    setUser(userRes.data);
    setIsAuthenticated(true);
    return userRes.data;
  }, []);

  const signup = useCallback(async (data) => {
    const res = await authAPI.signup(data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Role check utilities
  const hasRole = useCallback(
    (role) => user?.role === role,
    [user]
  );

  const hasAnyRole = useCallback(
    (...roles) => roles.includes(user?.role),
    [user]
  );

  const isAdmin = useCallback(() => hasRole(ROLES.ADMIN), [hasRole]);
  const isAssetManager = useCallback(() => hasRole(ROLES.ASSET_MANAGER), [hasRole]);
  const isDepartmentHead = useCallback(() => hasRole(ROLES.DEPARTMENT_HEAD), [hasRole]);
  const isEmployee = useCallback(() => hasRole(ROLES.EMPLOYEE), [hasRole]);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    hasRole,
    hasAnyRole,
    isAdmin,
    isAssetManager,
    isDepartmentHead,
    isEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

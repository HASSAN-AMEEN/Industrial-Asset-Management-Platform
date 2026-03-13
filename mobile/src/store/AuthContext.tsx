import React, { createContext, useContext, useMemo, useState } from 'react';
import { setAuthToken } from '../services/api';
import authService, { AuthUser } from '../services/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsAuthLoading(true);
    try {
      const payload = await authService.login(email, password);
      setUser(payload.user);
      setToken(payload.token);
      setAuthToken(payload.token);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsAuthLoading(true);
    try {
      const payload = await authService.register(email, password);
      setUser(payload.user);
      setToken(payload.token);
      setAuthToken(payload.token);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isAuthLoading,
      login,
      signup,
      logout,
    }),
    [isAuthLoading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

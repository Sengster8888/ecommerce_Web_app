import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthContextType, LoginCredentials, RegisterData, VerifyOtpData, ForgotPasswordData, ResetPasswordData, User } from '../features/auth/types/auth.types';
import { getMeApi, loginApi, logoutApi, registerApi, verifyOtpApi, forgotPasswordApi, resetPasswordApi } from '../features/auth/api/auth.api';

import { getAccessToken, setAccessToken } from '../api/axios';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(getAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const userData = await getMeApi();
      setUser(userData);
      setAccessTokenState(token);
    } catch (err: any) {
      console.error('Failed to load current user:', err);
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await loginApi(credentials);
      setAccessToken(data.accessToken);
      setAccessTokenState(data.accessToken);
      setUser(data.user);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(', ')
          : 'Invalid credentials. Please try again.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await registerApi(data);
      return result;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(', ')
          : 'Registration failed. Please check your data and try again.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (data: VerifyOtpData) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await verifyOtpApi(data);
      setAccessToken(result.accessToken);
      setAccessTokenState(result.accessToken);
      setUser(result.user);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(', ')
          : 'Invalid or expired OTP code.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };


  const forgotPassword = async (data: ForgotPasswordData) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await forgotPasswordApi(data);
      return result;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(', ')
          : 'Failed to request password reset OTP.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await resetPasswordApi(data);
      return result;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(', ')
          : 'Failed to reset password. Please check your OTP code and try again.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {

    try {
      setIsLoading(true);
      await logoutApi();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        error,
        login,
        register,
        verifyOtp,
        forgotPassword,
        resetPassword,
        logout,
        clearError,
      }}


    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

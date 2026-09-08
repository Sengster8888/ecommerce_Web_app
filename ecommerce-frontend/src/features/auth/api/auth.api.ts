import { apiClient } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';
import type { AuthResponse, LoginCredentials, RegisterData, VerifyOtpData, ForgotPasswordData, ResetPasswordData, User } from '../types/auth.types';


export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
  return response.data;
};

export const registerApi = async (data: RegisterData): Promise<{ message: string; email: string }> => {
  const response = await apiClient.post<{ message: string; email: string }>(ENDPOINTS.AUTH.REGISTER, data);
  return response.data;
};

export const verifyOtpApi = async (data: VerifyOtpData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.VERIFY_OTP, data);
  return response.data;
};

export const forgotPasswordApi = async (data: ForgotPasswordData): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  return response.data;
};

export const resetPasswordApi = async (data: ResetPasswordData): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(ENDPOINTS.AUTH.RESET_PASSWORD, data);
  return response.data;
};


export const getMeApi = async (): Promise<User> => {
  const response = await apiClient.get<User>(ENDPOINTS.AUTH.ME);
  return response.data;
};

export const logoutApi = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(ENDPOINTS.AUTH.LOGOUT);
  return response.data;
};

// src/services/authService.js
// This service acts as a bridge between mock API and real API
// Switch between them using VITE_USE_MOCK_API environment variable

import api from './api';

// Determine if we should use mock API
// const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// console.log(`🔧 Using ${USE_MOCK_API ? 'MOCK API' : 'REAL API'} for authentication`);

// ============================================================================
// REAL API FUNCTIONS (When USE_MOCK_API = false)
// ============================================================================

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
  },

  register: async (email, password, name, phone) => {
    const response = await api.post('/auth/register', { email, password, name, phone });
    return response;
  },

  verifyEmailOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-email', { email, otp });
    return response;
  },

  verify2FA: async (userId, otp) => {
    const response = await api.post('/auth/verify-2fa', { userId, otp });
    return response;
  },

  enable2FARequest: async () => {
    const response = await api.post('/auth/2fa/enable-request');
    return response;
  },

  enable2FAConfirm: async (otp) => {
    const response = await api.post('/auth/2fa/enable-confirm', { otp });
    return response;
  },

  disable2FA: async (password) => {
    const response = await api.post('/auth/2fa/disable', { password });
    return response;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response;
  },

  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  },

  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response;
  },

  logout: async () => {
    return await api.post('/auth/logout');
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response;
  },
};

// ============================================================================
// EXPORT UNIFIED SERVICE
// ============================================================================

export default authService;

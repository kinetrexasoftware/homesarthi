import useAuthStore from '../store/useAuthStore';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    setAuth,
    logout,
    updateUser,
    refreshUser
  } = useAuthStore();

  const handleLogin = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data.data;
      setAuth(user, token);
      toast.success('Login successful!');
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const handleRegister = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data.data;
      setAuth(user, token);
      toast.success('Registration successful!');
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleUpdateProfile = async (formData) => {
    try {
      const response = await api.put('/users/profile', formData);
      const updatedUser = response.data.data.user;
      updateUser(updatedUser);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await refreshUser();
    } catch (error) {
      handleLogout();
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset email sent!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await api.post('/auth/reset-password', { token, password: newPassword });
      toast.success('Password reset successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  return {
    // State
    user,
    isAuthenticated,

    // Actions
    handleLogin,
    handleRegister,
    handleLogout,
    handleUpdateProfile,
    checkAuthStatus,
    requestPasswordReset,
    resetPassword
  };
};

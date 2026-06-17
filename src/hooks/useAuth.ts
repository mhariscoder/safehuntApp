import { Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { login, signup, logout, resetPassword } from '../features/auth/authActions';
import { updateUser, clearError } from '../features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const handleLogin = async (email: string, password: string) => {
    return dispatch(login({ email, password })).unwrap();
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    return dispatch(signup({ email, password, name })).unwrap();
  };

  const handleLogout = async () => {
    return dispatch(logout()).unwrap();
  };

  const handleResetPassword = async (email: string) => {
    return dispatch(resetPassword({ email })).unwrap();
  };

  const handleUpdateUser = (userData: Partial<any>) => {
    Alert.alert('')
    dispatch(updateUser(userData));
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    updateUser: handleUpdateUser,
    clearError: handleClearError,
  };
};
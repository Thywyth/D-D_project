import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AuthScreen } from '../components/auth/AuthScreen';
import { ToastContainer } from '../components/ui/Toast';

export default function AuthPage(): React.ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/lobby" replace />;
  }

  return (
    <>
      <AuthScreen />
      <ToastContainer />
    </>
  );
}

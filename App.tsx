

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Assignments } from './pages/admin/Assignments';
import { Reviews } from './pages/admin/Reviews';
import { CalendarReports } from './pages/admin/CalendarReports';
import { Users } from './pages/admin/Users';
import { Businesses } from './pages/admin/Businesses';
import { CommentPool } from './pages/admin/CommentPool';
import { PaymentRequests } from './pages/admin/PaymentRequests';
import { AdminSupport } from './pages/admin/AdminSupport';
import { UserTasks } from './pages/user/UserTasks';
import { UserWallet } from './pages/user/UserWallet';
import { UserSupport } from './pages/user/UserSupport';
import { UserRole } from './types';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: UserRole }> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
     // Redirect based on actual role if trying to access unauthorized area
     if (user?.role === UserRole.ADMIN) return <Navigate to="/admin/dashboard" replace />;
     if (user?.role === UserRole.USER) return <Navigate to="/user/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Determine home route based on role
  const getHomeRoute = () => {
      if (user?.role === UserRole.ADMIN) return "/admin/dashboard";
      if (user?.role === UserRole.USER) return "/user/dashboard";
      return "/login";
  };

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated 
          ? <Navigate to={getHomeRoute()} replace /> 
          : <Login />
      } />

      <Route element={<Layout />}>
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="/admin/businesses" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <Businesses />
          </ProtectedRoute>
        } />
        <Route path="/admin/assignments" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <Assignments />
          </ProtectedRoute>
        } />
        <Route path="/admin/reviews" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <Reviews />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <CalendarReports />
          </ProtectedRoute>
        } />
        <Route path="/admin/pool" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <CommentPool />
          </ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <PaymentRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/support" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <AdminSupport />
          </ProtectedRoute>
        } />

        {/* User Routes */}
        <Route path="/user/dashboard" element={
            <ProtectedRoute requiredRole={UserRole.USER}>
                <UserTasks />
            </ProtectedRoute>
        } />
        <Route path="/user/wallet" element={
            <ProtectedRoute requiredRole={UserRole.USER}>
                <UserWallet />
            </ProtectedRoute>
        } />
        <Route path="/user/support" element={
            <ProtectedRoute requiredRole={UserRole.USER}>
                <UserSupport />
            </ProtectedRoute>
        } />
        
        {/* Fallback for root */}
        <Route path="/" element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Navigate to="/login" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider> 
        <DataProvider>
          <AuthProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import { initSocket, disconnectSocket } from './utils/socket';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';

import StudentDashboard from './pages/StudentDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerAnalytics from './pages/OwnerAnalytics';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoomsPage from './pages/AdminRoomsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminAuditPage from './pages/AdminAuditPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminLayout from './components/admin/AdminLayout';

import CreateRoomPage from './pages/CreateRoomPage';
import MyRoomsPage from './pages/MyRoomsPage';
import VisitsPage from './pages/VisitsPage';
import EditRoomPage from './pages/EditRoomPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import AdminSupport from './components/admin/AdminSupport';
import DeleteAccountPage from './pages/DeleteAccountPage';

function App() {
  const { user, isAuthenticated, refreshUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
      if (user?._id) {
        initSocket(user._id);
      }
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?._id]); // Only re-run if auth status or ID changes

  if (isAuthenticated && user?.isFirstLogin && !window.location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex flex-col">
      <Navbar />
      <ScrollToTop />
      <main className={isAdminRoute ? "flex-1" : "min-h-[calc(100vh-80px)]"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute roles={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/analytics"
            element={
              <ProtectedRoute roles={['owner']}>
                <OwnerAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/rooms/new"
            element={
              <ProtectedRoute roles={['owner']}>
                <CreateRoomPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/rooms"
            element={
              <ProtectedRoute roles={['owner']}>
                <MyRoomsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/rooms/:id/edit"
            element={
              <ProtectedRoute roles={['owner']}>
                <EditRoomPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/visits"
            element={
              <ProtectedRoute>
                <VisitsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="rooms" element={<AdminRoomsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route path="/settings" element={<Navigate to="/profile" replace />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminRoute && !isAuthPage && <Footer />}
    </div>
  );
}

export default App;
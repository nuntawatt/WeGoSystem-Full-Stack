// apps/frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Explore from './pages/Explore';
import GroupDetail from './pages/groups/GroupDetail';
import Create from './pages/Create';
import Profile from './pages/Profile';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPassword';
import ResetPasswordConfirm from './pages/auth/ResetPasswordConfirm';
import ProtectedRoute from './routes/ProtectedRoute';
import Toasts from './components/Toasts';
import './lib/i18n';
import Home from './pages/Home';
import Schedule from './pages/groups/Schedule';
import DirectChat from './pages/dm/DirectChat';
import { DMProvider } from './hooks/useDM';
import DMFloating from './components/DMFloating';

export default function App() {
  return (
    <DMProvider>
      <div className="min-h-screen bg-primary-900">
        <Navbar />

        <main className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />

            <Route
              path="/groups/:id"
              element={
                <ProtectedRoute>
                  <GroupDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id/schedule"
              element={
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              }
            />

            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <Create />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dm/:uid"
              element={
                <ProtectedRoute>
                  <DirectChat />
                </ProtectedRoute>
              }
            />

            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/reset" element={<ResetPasswordConfirm />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <DMFloating />
        <Toasts />
      </div>
    </DMProvider>
  );
}

import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import DashboardLayout from './components/common/DashboardLayout';

// Auth Modals
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import OtpVerification from './components/auth/OtpVerification';
import ForgotPasswordModal from './components/auth/ForgotPasswordModal';

// Pages
import HomePage from './pages/public/HomePage';
import PaymentReturn from './pages/public/PaymentReturn';
import PatientLayout from './components/patient/PatientLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientBooking from './pages/patient/PatientBooking';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientProfile from './pages/patient/PatientProfile';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import DoctorAIDiagnosis from './pages/doctor/DoctorAIDiagnosis';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminProfile from './pages/admin/AdminProfile';
import SessionManagement from './pages/admin/SessionManagement';
import SessionDetail from './pages/admin/SessionDetail';
import ServiceManagement from './pages/admin/ServiceManagement';
import MedicationManagement from './pages/admin/MedicationManagement';
import EmailManagement from './pages/admin/EmailManagement';
import InvoiceManagement from './pages/admin/InvoiceManagement';
import DetailedStatistics from './pages/admin/DetailedStatistics';

function ProtectedRoute({ allowedRoles, children, onOpenLogin }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 450, margin: '0 auto', padding: 32 }}>
          <h2>Yêu cầu đăng nhập</h2>
          <p style={{ color: 'var(--gray-500)', margin: '12px 0 24px' }}>
            Bạn cần đăng nhập để truy cập trang này.
          </p>
          <button className="btn btn-primary" onClick={onOpenLogin} style={{ width: '100%' }}>
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect user to their own role dashboard
    const target = role === 'ADMIN' ? '/admin' : role === 'DOCTOR' ? '/doctor' : '/patient';
    // Tránh vòng lặp chuyển hướng vô tận nếu trang hiện tại trùng với target
    if (location.pathname === target) {
      return children;
    }
    return <Navigate to={target} replace />;
  }

  return children;
}

function RoleProfileRedirect() {
  const { role } = useAuth();
  if (role === 'DOCTOR') return <Navigate to="/doctor/profile" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/profile" replace />;
  return <Navigate to="/patient/profile" replace />;
}

export default function App() {
  const [modalState, setModalState] = useState({
    login: false,
    register: false,
    otp: false,
    forgot: false,
    otpUsername: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const isDashboardRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/doctor') ||
    location.pathname.startsWith('/patient');

  const openLogin = () => setModalState({ login: true, register: false, otp: false, forgot: false, otpUsername: '' });
  const openRegister = () => setModalState({ login: false, register: true, otp: false, forgot: false, otpUsername: '' });
  const openForgot = () => setModalState({ login: false, register: false, otp: false, forgot: true, otpUsername: '' });
  const openOtp = (username) => setModalState({ login: false, register: false, otp: true, forgot: false, otpUsername: username });
  const closeModal = () => setModalState({ login: false, register: false, otp: false, forgot: false, otpUsername: '' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isDashboardRoute && (
        <Navbar onLoginClick={openLogin} onRegisterClick={openRegister} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Public Landing */}
          <Route
            path="/"
            element={
              <>
                <HomePage onLoginClick={openLogin} onRegisterClick={openRegister} />
                <Footer />
              </>
            }
          />

          {/* Payment Return Callback Route */}
          <Route path="/payment-return" element={<PaymentReturn />} />

          {/* Patient Routes - MediBook Format Portal */}
          <Route
            path="/patient"
            element={
              <PatientLayout onLoginClick={openLogin} onRegisterClick={openRegister}>
                <PatientDashboard />
              </PatientLayout>
            }
          />
          <Route
            path="/patient/booking"
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'USER', 'ADMIN']} onOpenLogin={openLogin}>
                <PatientLayout onLoginClick={openLogin} onRegisterClick={openRegister}>
                  <PatientBooking />
                </PatientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'USER', 'ADMIN']} onOpenLogin={openLogin}>
                <PatientLayout onLoginClick={openLogin} onRegisterClick={openRegister}>
                  <PatientAppointments />
                </PatientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'USER', 'ADMIN']} onOpenLogin={openLogin}>
                <PatientLayout onLoginClick={openLogin} onRegisterClick={openRegister}>
                  <PatientProfile />
                </PatientLayout>
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <DoctorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/schedule"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <DoctorSchedule />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/sessions/:id"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <SessionDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/ai-diagnosis"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <DoctorAIDiagnosis />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <DoctorProfile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/statistics"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <DetailedStatistics />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <UserManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <SessionManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <SessionDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <ServiceManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/medications"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <MedicationManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/invoices"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <InvoiceManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/emails"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <EmailManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} onOpenLogin={openLogin}>
                <DashboardLayout>
                  <AdminProfile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Generic Profile Redirect */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute onOpenLogin={openLogin}>
                <RoleProfileRedirect />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Global Authentication Modals */}
      {modalState.login && (
        <LoginModal
          onClose={closeModal}
          onSwitchToRegister={openRegister}
          onForgotPassword={openForgot}
          onNeedOtp={(username) => openOtp(username)}
        />
      )}

      {modalState.register && (
        <RegisterModal
          onClose={closeModal}
          onSwitchToLogin={openLogin}
          onNeedOtp={(username) => openOtp(username)}
        />
      )}

      {modalState.otp && (
        <OtpVerification
          username={modalState.otpUsername}
          onClose={closeModal}
          onVerified={() => {
            closeModal();
            openLogin();
          }}
        />
      )}

      {modalState.forgot && (
        <ForgotPasswordModal
          onClose={closeModal}
          onSwitchToLogin={openLogin}
        />
      )}
    </div>
  );
}

import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import PassengerLayout from '../layouts/PassengerLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import SuperAdminLayout from '../layouts/SuperAdminLayout.jsx';
import OperatorLayout from '../layouts/OperatorLayout.jsx';

// Public pages
import HomePage from '../pages/public/HomePage.jsx';
import SearchResultsPage from '../pages/public/SearchResultsPage.jsx';
import SearchTripsPage from '../pages/public/SearchTripsPage.jsx';
import AboutPage from '../pages/public/AboutPage.jsx';
import ContactPage from '../pages/public/ContactPage.jsx';
import HowItWorksPage from '../pages/public/HowItWorksPage.jsx';
import RoutesPage from '../pages/public/RoutesPage.jsx';
import FAQPage from '../pages/public/FAQPage.jsx';
import TermsPage from '../pages/public/TermsPage.jsx';
import PrivacyPolicyPage from '../pages/public/PrivacyPolicyPage.jsx';
import BookingPolicyPage from '../pages/public/BookingPolicyPage.jsx';
import NotFoundPage from '../pages/public/NotFoundPage.jsx';

// Auth pages
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';

// Passenger pages
import PassengerDashboard from '../pages/passenger/PassengerDashboard.jsx';
import BookingPage from '../pages/passenger/BookingPage.jsx';
import PaymentPage from '../pages/passenger/PaymentPage.jsx';
import BookingConfirmationPage from '../pages/passenger/BookingConfirmationPage.jsx';
import MyBookingsPage from '../pages/passenger/MyBookingsPage.jsx';
import ProfilePage from '../pages/passenger/ProfilePage.jsx';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import ManageSchedules from '../pages/admin/ManageSchedules.jsx';
import ManageBuses from '../pages/admin/ManageBuses.jsx';
import ManageDrivers from '../pages/admin/ManageDrivers.jsx';
import ManageRoutes from '../pages/admin/ManageRoutes.jsx';
import ManageBookings from '../pages/admin/ManageBookings.jsx';

// Super-Admin pages
import SuperAdminDashboard from '../pages/superAdmin/SuperAdminDashboard.jsx';
import ManageOperators from '../pages/superAdmin/ManageOperators.jsx';
import PlatformSettings from '../pages/superAdmin/PlatformSettings.jsx';
import ManageUsers from '../pages/superAdmin/ManageUsers.jsx';
import ManageCompanies from '../pages/superAdmin/ManageCompanies.jsx';

// Operator pages
import OperatorDashboard from '../pages/operator/OperatorDashboard.jsx';
import BoardingValidation from '../pages/operator/BoardingValidation.jsx';
import OperatorBookings from '../pages/operator/OperatorBookings.jsx';

// Route guards
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const ROLE_PROFILE_PATHS = {
  passenger: '/passenger/profile',
  admin: '/admin/profile',
  super_admin: '/super-admin/profile',
  operator: '/operator/profile',
};

function RoleProfileRedirect() {
  const { user } = useAuth();
  const profilePath = user ? (ROLE_PROFILE_PATHS[user.role] || '/') : '/login';

  return <Navigate to={profilePath} replace />;
}

export default function AppRouter() {
  return (
    <Routes>

      {/* ── Public routes ─────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/"                element={<HomePage />} />
        <Route path="/search"          element={<SearchResultsPage />} />
        <Route path="/search-trips"    element={<SearchTripsPage />} />
        <Route path="/about"           element={<AboutPage />} />
        <Route path="/contact"         element={<ContactPage />} />
        <Route path="/how-it-works"    element={<HowItWorksPage />} />
        <Route path="/routes"          element={<RoutesPage />} />
        <Route path="/faq"             element={<FAQPage />} />
        <Route path="/terms"           element={<TermsPage />} />
        <Route path="/privacy"         element={<PrivacyPolicyPage />} />
        <Route path="/booking-policy"  element={<BookingPolicyPage />} />
      </Route>

      {/* ── Auth routes ───────────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
      </Route>

      {/* ── Generic profile redirect (all authenticated roles) ── */}
      <Route element={<ProtectedRoute allowedRoles={[]} />}>
        <Route path="/profile" element={<RoleProfileRedirect />} />
      </Route>

      {/* ── Passenger routes ──────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['passenger']} />}>
        <Route element={<PassengerLayout />}>
          <Route path="/passenger"                  element={<PassengerDashboard />} />
          <Route path="/passenger/book"           element={<BookingPage />} />
          <Route path="/passenger/payment"        element={<PaymentPage />} />
          <Route path="/passenger/booking-confirm" element={<BookingConfirmationPage />} />
          <Route path="/passenger/bookings"       element={<MyBookingsPage />} />
          <Route path="/passenger/profile"        element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ── Admin routes ──────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"               element={<AdminDashboard />} />
          <Route path="/admin/schedules"     element={<ManageSchedules />} />
          <Route path="/admin/buses"         element={<ManageBuses />} />
          <Route path="/admin/drivers"       element={<ManageDrivers />} />
          <Route path="/admin/routes"        element={<ManageRoutes />} />
          <Route path="/admin/bookings"      element={<ManageBookings />} />
          <Route path="/admin/profile"       element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ── Super-Admin routes ────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/super-admin"             element={<SuperAdminDashboard />} />
          <Route path="/super-admin/companies"   element={<ManageCompanies />} />
          <Route path="/super-admin/operators"   element={<ManageOperators />} />
          <Route path="/super-admin/users"       element={<ManageUsers />} />
          <Route path="/super-admin/settings"    element={<PlatformSettings />} />
          <Route path="/super-admin/profile"     element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ── Operator routes ───────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['operator']} />}>
        <Route element={<OperatorLayout />}>
          <Route path="/operator"           element={<OperatorDashboard />} />
          <Route path="/operator/boarding"  element={<BoardingValidation />} />
          <Route path="/operator/bookings"  element={<OperatorBookings />} />
          <Route path="/operator/profile"   element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ── Fallback ──────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
}

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DashboardLayout } from './layouts/DashboardLayout';

// Code-split routes for fast bundle chunking
const LoginPage = lazy(() =>
  import('./pages/Login/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const PurchasesPage = lazy(() =>
  import('./pages/Purchases/PurchasesPage').then((m) => ({ default: m.PurchasesPage }))
);
const CallingManagementPage = lazy(() =>
  import('./pages/CallingManagement/CallingManagementPage').then((m) => ({
    default: m.CallingManagementPage,
  }))
);
const FeedbackPage = lazy(() =>
  import('./pages/Feedback/FeedbackPage').then((m) => ({ default: m.FeedbackPage }))
);
const ComplaintsPage = lazy(() =>
  import('./pages/Complaints/ComplaintsPage').then((m) => ({ default: m.ComplaintsPage }))
);
const ReportsPage = lazy(() =>
  import('./pages/Reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/Settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s
      refetchOnWindowFocus: false,
    },
  },
});

function RouteLoading() {
  return (
    <div className="flex items-center justify-center py-20 text-content-muted">
      <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Dashboard Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<DashboardLayout />}>
                    <Route
                      index
                      element={
                        <ErrorBoundary>
                          <DashboardPage />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="purchases"
                      element={
                        <ErrorBoundary>
                          <PurchasesPage />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="calling"
                      element={
                        <ErrorBoundary>
                          <CallingManagementPage />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="feedback"
                      element={
                        <ErrorBoundary>
                          <FeedbackPage />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="complaints"
                      element={
                        <ErrorBoundary>
                          <ComplaintsPage />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="reports"
                      element={
                        <ErrorBoundary>
                          <ReportsPage />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="settings"
                      element={
                        <ErrorBoundary>
                          <SettingsPage />
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

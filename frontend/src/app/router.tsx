import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Spinner } from "../components/common/Spinner";
import { AppLayout } from "../components/layout/AppLayout";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ROLES } from "../constants/roles";
import { ROUTES } from "../constants/routes";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { PublicRoute } from "../routes/PublicRoute";
import { RoleRoute } from "../routes/RoleRoute";
import { DashboardPage, PlaceholderPage } from "./pages";

const LazyModule = lazy(async () => ({
  default: () => <PlaceholderPage title="Lazy Loaded Module" />,
}));

function SuspensePage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.login, element: <LoginPage /> },
          { path: ROUTES.register, element: <RegisterPage /> },
          { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          {
            element: <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]} />,
            children: [
              {
                path: ROUTES.hospitals,
                element: <PlaceholderPage title="Hospital Management" />,
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF, ROLES.PATIENT]} />,
            children: [
              {
                path: ROUTES.doctors,
                element: <PlaceholderPage title="Doctor Management" />,
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={[ROLES.ADMIN]} />,
            children: [
              {
                path: ROUTES.staff,
                element: <PlaceholderPage title="Staff Management" />,
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]} />,
            children: [
              {
                path: ROUTES.patients,
                element: <PlaceholderPage title="Patient Management" />,
              },
            ],
          },
          {
            path: ROUTES.appointments,
            element: (
              <SuspensePage>
                <LazyModule />
              </SuspensePage>
            ),
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to={ROUTES.dashboard} replace /> },
]);

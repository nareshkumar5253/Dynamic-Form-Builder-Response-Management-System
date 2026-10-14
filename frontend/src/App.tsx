
import { Alert, Box, CircularProgress } from "@mui/material";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import DashboardPage from "./pages/dashboard/Dashboard";
import FormsPage from "./pages/forms/FormsPage";
import ResponsesPage from "./pages/responses/ResponsesPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import ActivityLogsPage from "./pages/activity-logs/ActivityLogsPage";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

function LoginPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const message = (
    location.state as { message?: string } | null
  )?.message;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {message && (
        <Alert severity="success" sx={{ mx: 2, mt: 2 }}>
          {message}
        </Alert>
      )}

      <Login />
    </>
  );
}

function RegisterPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Register />;
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/forms"
            element={<FormsPage />}
          />

          <Route
            path="/responses"
            element={<ResponsesPage />}
          />

          <Route
            path="/analytics"
            element={<AnalyticsPage />}
          />

          <Route
            path="/activity-logs"
            element={<ActivityLogsPage />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;

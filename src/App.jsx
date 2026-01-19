import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import { Toaster } from "sonner";
import routes from "./route/SidebarRaoute";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading Admin Panel...</p>
    </div>
  </div>
);

function App() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />

        {/* Protected */}
        {isLoggedIn ? (
          <Route element={<DashboardLayout />}>
            {routes.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Component />
                  </Suspense>
                }
              />
            ))}
            <Route path="*" element={<Navigate to="/survey-responses" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
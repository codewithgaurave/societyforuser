// src/components/DashboardLayout.jsx
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import routes from ".././route/SidebarRaoute";
import Sidebar from "../pages/Sidebar";
import Header from "./Header";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Auth: admin object + logout
  const { admin, logout } = useAuth();

  const { themeColors, toggleTheme, palette, changePalette } = useTheme();
  const { currentFont, corporateFonts, changeFont } = useFont();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPageTitle = useMemo(() => {
    return routes.find((route) => route.path === location.pathname)?.name || "Dashboard";
  }, [location.pathname]);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar  = useCallback(() => setSidebarOpen(false), []);

  // ✅ Logout handler: context clear + redirect to /login
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundColor: themeColors.background,
        fontFamily:
          currentFont.family ||
          'var(--app-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        routes={routes}
        currentPath={location.pathname}
        user={admin}          
        logout={handleLogout} 
        themeColors={themeColors}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          toggleSidebar={toggleSidebar}
          currentPageTitle={currentPageTitle}
          themeColors={themeColors}
          currentFont={currentFont}
          corporateFonts={corporateFonts}
          changeFont={changeFont}
          palette={palette}
          changePalette={changePalette}
          toggleTheme={toggleTheme}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: themeColors.background }}>
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
// src/pages/Sidebar.jsx
import { Link } from "react-router-dom";
import { memo } from "react";
import { 
  FaTachometerAlt, 
  FaGavel, 
  FaBox, 
  FaUsers, 
  FaChartBar, 
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle
} from "react-icons/fa";

const SidebarItem = memo(({ route, isActive, themeColors, onClose }) => {
  const IconComponent = route.icon;
  
  return (
    <Link
      to={route.path}
      className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive ? "shadow-md" : "hover:shadow-sm"
      }`}
      style={{
        color: isActive ? themeColors.primary : themeColors.text,
        backgroundColor: isActive
          ? themeColors.active?.background || `${themeColors.primary}15`
          : "transparent",
        border: isActive ? `1px solid ${themeColors.primary}30` : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor =
            themeColors.hover?.background || `${themeColors.primary}10`;
          e.currentTarget.style.borderColor = `${themeColors.primary}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }
      }}
      onClick={onClose}
      aria-current={isActive ? "page" : undefined}
    >
      <IconComponent
        className="mr-3 text-lg transition-colors duration-200"
        style={{
          color: isActive ? themeColors.primary : themeColors.textSecondary,
        }}
      />
      <span className="font-medium text-sm">{route.name}</span>
    </Link>
  );
});

SidebarItem.displayName = "SidebarItem";

const Sidebar = ({
  isOpen,
  onClose,
  routes,
  currentPath,
  user,
  logout,
  themeColors,
}) => {
  // 🔥 Sirf wahi routes jo hide: true NA ho
  const visibleRoutes = routes.filter((r) => !r.hide);

  // Active check — nested paths handle karega (e.g. /surveys/123/questions)
  const isRouteActive = (route) => {
    if (currentPath === route.path) return true;
    // agar route.path "/" nahi hai aur currentPath usse start hota hai
    if (
      route.path !== "/" &&
      currentPath.startsWith(route.path + "/")
    ) {
      return true;
    }
    return false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out w-64 flex flex-col border-r`}
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between h-16 px-4 border-b"
          style={{ borderColor: themeColors.border }}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-white p-1">
              <img
                src="querylogo.png"
                alt="Auction Here Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1
              className="text-xl font-bold"
              style={{ color: themeColors.primary }}
            >
              Society Admin
            </h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:scale-110 transition-all duration-200"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.background,
            }}
            aria-label="Close sidebar"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-4 space-y-2" aria-label="Main navigation">
            {visibleRoutes.map((route) => (
              <SidebarItem
                key={route.path}
                route={route}
                isActive={isRouteActive(route)}
                themeColors={themeColors}
                onClose={onClose}
              />
            ))}
          </nav>
        </div>

        {/* User Section */}
        <div
          className="p-4 border-t"
          style={{ borderColor: themeColors.border }}
        >
          <div
            className="flex items-center mb-4 p-3 rounded-lg"
            style={{ backgroundColor: themeColors.background }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3 border"
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.onPrimary,
                borderColor: themeColors.border,
              }}
              aria-hidden="true"
            >
              <FaUserCircle className="text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-medium text-sm truncate"
                style={{ color: themeColors.text }}
              >
                {user?.name || "Society Manager"}
              </p>
              <p
                className="text-xs opacity-75 truncate"
                style={{ color: themeColors.textSecondary }}
              >
                {user?.role || "Administrator"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 px-4 rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-2 border hover:shadow-md"
            style={{
              color: themeColors.danger,
              backgroundColor: "transparent",
              borderColor: themeColors.danger,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.danger;
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = themeColors.danger;
              e.currentTarget.style.transform = "translateY(0)";
            }}
            aria-label="Sign out"
          >
            <FaSignOutAlt className="text-sm" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default memo(Sidebar);

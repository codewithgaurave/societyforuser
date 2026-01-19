// src/components/Header.jsx
import { memo, useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { 
  FaCog, 
  FaSun, 
  FaMoon, 
  FaPalette, 
  FaFont, 
  FaTimes,
  FaBriefcase,
  FaStar,
  FaGem,
  FaSquare
} from "react-icons/fa";

const SettingsModal = ({
  isOpen,
  onClose,
  themeColors,
  palette,
  changePalette,
  toggleTheme,
  availablePalettes
}) => {
  // Use FontContext directly in SettingsModal
  const { currentFont, premiumFonts, changeFont } = useFont();

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Palette display names and icons
  const paletteInfo = {
    corporate: { label: "Professional", icon: FaBriefcase, desc: "Clean & formal" },
    luxury: { label: "Luxury", icon: FaStar, desc: "Premium & elegant" },
    modern: { label: "Modern", icon: FaGem, desc: "Fresh & vibrant" },
    minimal: { label: "Minimal", icon: FaSquare, desc: "Simple & clean" }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{
        backgroundColor: themeColors.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-auto p-4 rounded-xl shadow-2xl border max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          boxShadow: `0 10px 25px -5px ${themeColors.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Circular */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:rotate-90 transition-all duration-300 border"
          style={{
            color: themeColors.textSecondary,
            backgroundColor: themeColors.background,
            borderColor: themeColors.mode === 'light' ? themeColors.primary : themeColors.border,
          }}
          aria-label="Close settings"
        >
          <FaTimes className="text-sm" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <FaCog className="text-lg" style={{ color: themeColors.primary }} />
            <h3
              className="text-lg font-semibold"
              style={{ color: themeColors.text }}
            >
              Settings
            </h3>
          </div>
          <p
            className="text-xs"
            style={{ color: themeColors.textSecondary }}
          >
            Customize your workspace
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Theme Section */}
          <div>
            <label
              className="flex items-center gap-2 text-xs font-medium mb-2"
              style={{ color: themeColors.text }}
            >
              <FaPalette className="text-sm" />
              Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all duration-200 ${themeColors.mode === 'light' ? 'ring-1' : ''
                  }`}
                style={{
                  backgroundColor: themeColors.mode === 'light' ? themeColors.primary : themeColors.background,
                  borderColor: themeColors.mode === 'light' ? themeColors.primary : themeColors.border,
                  color: themeColors.mode === 'light' ? themeColors.onPrimary : themeColors.text,
                  ringColor: themeColors.primary,
                }}
              >
                <FaSun className="text-sm" />
                <span className="text-xs font-medium">Light</span>
              </button>
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all duration-200 ${themeColors.mode === 'dark' ? 'ring-1' : ''
                  }`}
                style={{
                  backgroundColor: themeColors.mode === 'dark' ? themeColors.primary : themeColors.background,
                  borderColor: themeColors.mode === 'dark' ? themeColors.primary : themeColors.border,
                  color: themeColors.mode === 'dark' ? themeColors.onPrimary : themeColors.text,
                  ringColor: themeColors.primary,
                }}
              >
                <FaMoon className="text-sm" />
                <span className="text-xs font-medium">Dark</span>
              </button>
            </div>
          </div>

          {/* Font Section */}
          <div>
            <label
              className="flex items-center gap-2 text-xs font-medium mb-2"
              style={{ color: themeColors.text }}
            >
              <FaFont className="text-sm" />
              Font
            </label>
            <div className="relative">
              <select
                value={currentFont.key}
                onChange={(e) => changeFont(e.target.value)}
                className="w-full p-2 rounded-lg border focus:outline-none focus:ring-1 transition-all duration-200 text-xs appearance-none cursor-pointer"
                style={{
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                  focusRingColor: themeColors.primary
                }}
              >
                {Object.values(premiumFonts).map((font) => (
                  <option
                    key={font.key}
                    value={font.key}
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                  >
                    {font.label}
                  </option>
                ))}
              </select>
              <div
                className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
                style={{ color: themeColors.textSecondary }}
              >
                <span className="text-xs">▼</span>
              </div>
            </div>
          </div>

          {/* Color Palette Section */}
          <div>
            <label
              className="flex items-center gap-2 text-xs font-medium mb-2"
              style={{ color: themeColors.text }}
            >
              <FaPalette className="text-sm" />
              Color Scheme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availablePalettes.map((paletteKey) => {
                const IconComponent = paletteInfo[paletteKey]?.icon || FaPalette;
                return (
                  <button
                    key={paletteKey}
                    onClick={() => changePalette(paletteKey)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all duration-200 group ${palette === paletteKey ? 'ring-1' : ''
                      }`}
                    style={{
                      backgroundColor: palette === paletteKey ? themeColors.primary : themeColors.background,
                      borderColor: palette === paletteKey ? themeColors.primary : themeColors.border,
                      color: palette === paletteKey ? themeColors.onPrimary : themeColors.text,
                      ringColor: themeColors.primary,
                    }}
                    title={paletteInfo[paletteKey]?.label || paletteKey}
                  >
                    <IconComponent 
                      className="text-sm mb-1 group-hover:scale-110 transition-transform duration-200" 
                    />
                    <span className="text-xs truncate w-full">
                      {paletteInfo[paletteKey]?.label || paletteKey}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: themeColors.border }}>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 p-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80 border"
              style={{
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border
              }}
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="flex-1 p-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.onPrimary,
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = memo(({
  toggleSidebar,
  currentPageTitle
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { themeColors, toggleTheme, palette, changePalette, availablePalettes } = useTheme();
  const { currentFont } = useFont();

  return (
    <>
      <header
        className="h-16 flex items-center justify-between px-4 border-b backdrop-blur-sm sticky top-0 z-40"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        <div className="flex items-center min-w-0 flex-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden mr-3 p-1.5 rounded-md hover:scale-110 transition-all duration-200"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.background
            }}
            aria-label="Open sidebar"
          >
            <span className="text-base">☰</span>
          </button>
          <h2
            className="text-sm font-semibold truncate"
            style={{
              color: themeColors.text,
              fontFamily: currentFont.family
            }}
          >
            {currentPageTitle}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-md border hover:scale-110 hover:rotate-45 transition-all duration-300 group"
            style={{
              backgroundColor: themeColors.background,
              color: themeColors.text,
              borderColor: themeColors.border,
            }}
            aria-label="Open settings"
            title="Settings"
          >
            <FaCog className="text-sm group-hover:animate-spin" />
          </button>

          {/* Quick Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border hover:scale-110 transition-all duration-300 group"
            style={{
              backgroundColor: themeColors.background,
              color: themeColors.text,
              borderColor: themeColors.border,
            }}
            aria-label="Quick theme toggle"
            title={`Switch to ${themeColors.mode === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {themeColors.mode === "dark" ? (
              <FaSun className="text-sm group-hover:rotate-180 transition-transform duration-300" />
            ) : (
              <FaMoon className="text-sm group-hover:rotate-180 transition-transform duration-300" />
            )}
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        themeColors={themeColors}
        palette={palette}
        changePalette={changePalette}
        toggleTheme={toggleTheme}
        availablePalettes={availablePalettes}
      />
    </>
  );
});

Header.displayName = 'Header';
export default Header;
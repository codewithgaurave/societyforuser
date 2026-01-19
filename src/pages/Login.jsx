// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../apis/auth"; // ADMIN login

const Login = () => {
  const [credentials, setCredentials] = useState({
    adminId: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setLoginData } = useAuth();
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await adminLogin({
        adminId: credentials.adminId.trim(),
        password: credentials.password,
      });

      // Backend expected:
      // { message, admin: { ... }, token }
      if (!res || !res.token || !res.admin) {
        throw new Error("Invalid response from server");
      }

      const adminObject = {
        ...res.admin, // adminId, name, id, etc.
        token: res.token,
      };

      // Save in Auth Context (also saves to localStorage)
      setLoginData(adminObject);

      // Redirect after login (admin dashboard route as per your app)
      navigate("/dashboard", { replace: true });
      // or navigate("/admin-dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: themeColors.background,
        fontFamily: currentFont.family,
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-lg border"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        {/* Branding Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-white p-2 shadow">
            <img
              src="querylogo.png"
              alt="Query Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: themeColors.primary }}
          >
            Society Admin
          </h1>

          <p
            className="text-sm"
            style={{ color: themeColors.textSecondary }}
          >
            Admin Control Panel
          </p>
        </div>

        {/* Error Box */}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-center text-sm"
            style={{
              backgroundColor: themeColors.danger + "15",
              color: themeColors.danger,
              border: `1px solid ${themeColors.danger}30`,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin ID */}
          <div>
            <label
              htmlFor="adminId"
              className="block mb-2 text-sm font-medium"
              style={{ color: themeColors.text }}
            >
              Admin ID
            </label>
            <input
              type="text"
              id="adminId"
              name="adminId"
              value={credentials.adminId}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border,
              }}
              placeholder="Enter admin ID (e.g. superadmin)"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium"
              style={{ color: themeColors.text }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border,
              }}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.onPrimary,
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In as Admin"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

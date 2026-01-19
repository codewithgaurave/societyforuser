// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

// Keys for localStorage (ADMIN ONLY)
const ADMIN_KEY = "admin-data";
const ADMIN_TOKEN_KEY = "admin-token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // logged-in ADMIN
  const [token, setToken] = useState(null); // JWT token
  const [loading, setLoading] = useState(true);

  // Load saved data from storage
  useEffect(() => {
    const savedAdmin = localStorage.getItem(ADMIN_KEY);
    const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (savedAdmin) {
      setUser(JSON.parse(savedAdmin));
    }
    if (savedToken) {
      setToken(savedToken);
    }

    setLoading(false);
  }, []);

  // Generic login helper
  const setLoginData = (adminData) => {
    if (!adminData) return;

    setUser(adminData);
    setToken(adminData?.token || null);

    localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData));
    if (adminData.token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, adminData.token);
    }
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  };

  const isLoggedIn = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,       // this is actually the logged-in admin object
        token,
        loading,
        isLoggedIn,
        setLoginData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

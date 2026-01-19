// src/apis/http.js
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach Admin token for every request
http.interceptors.request.use((config) => {
  // 🔥 Sirf ADMIN ka token (admin-token) use karenge
  const adminToken = localStorage.getItem("admin-token");

  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else {
    // Optional: agar token hi nahi hai to header hata do
    delete config.headers.Authorization;
  }

  return config;
});

export default http;

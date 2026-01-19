// src/apis/auth.js
import http from "./http";

// ---- ADMIN LOGIN ONLY ----
// POST /api/admin/login
// Body: { adminId, password }
// Response: { message, admin, token }
export const adminLogin = async ({ adminId, password }) => {
  const { data } = await http.post("/api/admin/login", {
    adminId,
    password,
  });

  // Expected:
  // {
  //   "message": "Login successful",
  //   "admin": {
  //       "adminId": "superadmin",
  //       "name": "Super Admin",
  //       "id": "6929a2e291f04c985f9d9fcc"
  //   },
  //   "token": "...."
  // }

  return data; // { message, admin, token }
};

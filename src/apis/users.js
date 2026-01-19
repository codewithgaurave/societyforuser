// src/apis/users.js
import http from "./http";

// PUBLIC / ADMIN: Register user
// POST /api/users/register
export const registerUser = async (payload) => {
  const { data } = await http.post("/api/users/register", payload);
  return data;
};

export const listTatkalUsers = async () => {
  const { data } = await http.get("/api/users/tatkal");
  // Agar API exactly wohi de rahi hai jo tumne bheja hai:
  // { users: [...] }
  if (Array.isArray(data)) return data;
  return data?.users || [];
};

// ADMIN ONLY: List all users
// GET /api/users
export const listUsers = async () => {
  const { data } = await http.get("/api/users");
  if (Array.isArray(data)) return data;
  return data?.users || [];
};

// ✅ NEW: Get user full details (profile + availability + holidays + templates)
// GET /api/users/:userId/details
export const getUserDetails = async (userId) => {
  const { data } = await http.get(`/api/users/${userId}/details`);
  return data; // { user, availability, holidays, templates, hasActiveHoliday, hasTemplates }
};

// ADMIN ONLY: Block / Unblock user
// PATCH /api/users/:userId/block
export const updateUserBlockStatus = async (userId, isBlocked) => {
  const { data } = await http.patch(`/api/users/${userId}/block`, { isBlocked });
  return data;
};

// ADMIN ONLY: Update user (without password)
// PUT /api/users/:userId
export const adminUpdateUser = async (userId, payload) => {
  const { data } = await http.put(`/api/users/${userId}`, payload);
  return data;
};

// ADMIN ONLY: Delete user
// DELETE /api/users/:userId
export const deleteUser = async (userId) => {
  const { data } = await http.delete(`/api/users/${userId}`);
  return data;
};

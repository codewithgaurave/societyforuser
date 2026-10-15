import http from "./http";

// --- CATEGORIES ---

// GET /api/community-categories/admin/all
export const listAdminCategories = async () => {
  const { data } = await http.get("/api/community-categories/admin/all");
  return data?.categories || [];
};

// POST /api/community-categories/admin
export const createCategoryApi = async (categoryData) => {
  const { data } = await http.post("/api/community-categories/admin", categoryData);
  return data;
};

// PUT /api/community-categories/admin/:id
export const updateCategoryApi = async (id, categoryData) => {
  const { data } = await http.put(`/api/community-categories/admin/${id}`, categoryData);
  return data;
};

// DELETE /api/community-categories/admin/:id
export const deleteCategoryApi = async (id) => {
  const { data } = await http.delete(`/api/community-categories/admin/${id}`);
  return data;
};

// POST /api/community-categories/admin/seed
export const seedCategoriesApi = async () => {
  const { data } = await http.post("/api/community-categories/admin/seed");
  return data;
};

// --- POSTS ---

// GET /api/community/admin/posts
export const listAdminPosts = async (params = {}) => {
  const { data } = await http.get("/api/community/admin/posts", { params });
  return data; // { posts, total, page, pages }
};

// PATCH /api/community/admin/posts/:id/toggle
export const togglePostActiveApi = async (id) => {
  const { data } = await http.patch(`/api/community/admin/posts/${id}/toggle`);
  return data;
};

// DELETE /api/community/admin/posts/:id
export const deletePostApi = async (id) => {
  const { data } = await http.delete(`/api/community/admin/posts/${id}`);
  return data;
};

// GET /api/community/admin/settings
export const getCommunitySettingsApi = async () => {
  const { data } = await http.get("/api/community/admin/settings");
  return data; // { communityAutoDeleteHours }
};

// PUT /api/community/admin/settings
export const updateCommunitySettingsApi = async (settings) => {
  const { data } = await http.put("/api/community/admin/settings", settings);
  return data;
};


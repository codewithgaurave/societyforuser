// src/apis/mainCategory.js
import http from "./http";

// ADMIN: List all main categories (active + inactive)
// GET /api/main-categories/admin/all/list
export const listMainCategories = async () => {
  const { data } = await http.get("/api/main-categories/admin/all/list");
  // Expected: { mainCategories: [...] } ya array
  if (Array.isArray(data)) return data;
  return data?.mainCategories || data?.data || [];
};

// ADMIN: Create main category
// POST /api/main-categories
// Body: { name, description, serviceCategoryIds: [] }
export const createMainCategory = async ({
  name,
  description,
  serviceCategoryIds = [],
}) => {
  const { data } = await http.post("/api/main-categories", {
    name,
    description,
    serviceCategoryIds,
  });

  // Expected: { message, mainCategory }
  return data;
};

// ADMIN: Update main category by ID
// PUT /api/main-categories/:mainCategoryId
export const updateMainCategory = async (mainCategoryId, payload) => {
  const { data } = await http.put(
    `/api/main-categories/${mainCategoryId}`,
    payload
  );
  // Expected: { message, mainCategory }
  return data;
};

// ADMIN: Delete (soft delete) main category by ID
// DELETE /api/main-categories/:mainCategoryId
export const deleteMainCategory = async (mainCategoryId) => {
  const { data } = await http.delete(`/api/main-categories/${mainCategoryId}`);
  // Expected: { message, mainCategory }
  return data;
};

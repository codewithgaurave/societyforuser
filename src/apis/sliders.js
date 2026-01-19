// src/apis/sliders.js
import http from "./http";

// ADMIN: Get all sliders
// GET /api/sliders/all
// Response: { sliders: [...] }  OR  [ ... ]
export const listSliders = async () => {
  const { data } = await http.get("/api/sliders/all");
  if (Array.isArray(data)) return data;
  return data?.sliders || [];
};

// ---- helpers for form-data ----
const buildSliderFormData = (payload, isUpdate = false) => {
  const { sliderImage, title, description, targetUrl, sortOrder, isActive } =
    payload;

  const fd = new FormData();

  // image optional in update, required in create (check in UI)
  if (sliderImage && sliderImage instanceof File) {
    fd.append("sliderImage", sliderImage);
  } else if (!isUpdate && sliderImage) {
    fd.append("sliderImage", sliderImage);
  }

  if (title !== undefined) fd.append("title", title);
  if (description !== undefined) fd.append("description", description);
  if (targetUrl !== undefined) fd.append("targetUrl", targetUrl);
  if (sortOrder !== undefined) fd.append("sortOrder", String(sortOrder));
  if (isActive !== undefined) fd.append("isActive", String(isActive));

  return fd;
};

// ADMIN: Create slider (multipart/form-data)
// POST /api/sliders
export const createSlider = async (payload) => {
  const formData = buildSliderFormData(payload, false);

  const { data } = await http.post("/api/sliders", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data; // { slider, message } etc.
};

// ADMIN: Update slider (multipart/form-data)
// PUT /api/sliders/:sliderId
export const updateSlider = async (sliderId, payload) => {
  const formData = buildSliderFormData(payload, true);

  const { data } = await http.put(`/api/sliders/${sliderId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data; // { slider, message } etc.
};

// ADMIN: Delete slider
// DELETE /api/sliders/:sliderId
export const deleteSlider = async (sliderId) => {
  const { data } = await http.delete(`/api/sliders/${sliderId}`);
  return data; // { message: "..." }
};

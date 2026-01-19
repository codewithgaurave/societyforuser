// src/apis/availability.js
import http from "./http";

// ADMIN / PUBLIC: Get all availability
// GET /api/availability
// Response:
// { availability: [ { ... } ] }  OR  [ { ... } ]
export const listAvailability = async () => {
  const { data } = await http.get("/api/availability");
  if (Array.isArray(data)) return data;
  return data?.availability || [];
};

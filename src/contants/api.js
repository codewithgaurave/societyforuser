// src/constants/api.js

const BASE_URL = import.meta.env.VITE_BASE_API;
const API_PREFIX = import.meta.env.VITE_API_URL || "api";

const apiRoutes = {
  employees: `${BASE_URL}/${API_PREFIX}/employees`,
};

export default apiRoutes;

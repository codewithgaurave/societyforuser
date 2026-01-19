export const getAdminToken = () => {
  if (typeof window === "undefined") return null;
  
  // check direct key first
  const token = localStorage.getItem("admin-token");
  if (token) return token;

  // fallback to admin-data
  try {
    const data = JSON.parse(localStorage.getItem("admin-data") || "{}");
    return data.token || null;
  } catch {
    return null;
  }
};

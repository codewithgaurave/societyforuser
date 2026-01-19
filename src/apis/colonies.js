import http from "./http";

// ADMIN / PUBLIC: Get all colonies
export const listColonies = async () => {
  const { data } = await http.get("/api/colonies");
  if (Array.isArray(data)) return data;
  return data?.colonies || [];
};

// ADMIN ONLY: Create colony
export const createColony = async (payload) => {
  const { data } = await http.post("/api/colonies", payload);
  return data;
};

// ADMIN ONLY: Update colony
export const updateColony = async (colonyId, payload) => {
  const { data } = await http.put(`/api/colonies/${colonyId}`, payload);
  return data;
};

// ADMIN ONLY: Delete colony
export const deleteColony = async (colonyId) => {
  const { data } = await http.delete(`/api/colonies/${colonyId}`);
  return data;
};

// ===== EXCEL FUNCTIONS =====

// Download Excel Template
export const downloadTemplate = async () => {
  const response = await http.get("/api/colonies/download-template", {
    responseType: "blob",
  });
  
  // Create blob link to download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `colony_import_template_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Import from Excel
export const importFromExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await http.post("/api/colonies/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  return data;
};

// Export colonies to Excel
export const exportToExcel = async (colonies) => {
  try {
    // First approach: Use backend API if available
    const response = await http.get("/api/colonies/export", {
      responseType: "blob",
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `colonies_export_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    // Fallback: Client-side export using xlsx library
    console.log("Using client-side export...");
    
    // Dynamically import xlsx
    const XLSX = await import('xlsx');
    
    // Prepare data for export
    const exportData = colonies.map(colony => ({
      "Name": colony.name || "",
      "Pincode": colony.pincode || "",
      "Address": colony.address || "",
      "City": colony.city || "",
      "Landmark": colony.landmark || "",
      "Description": colony.description || "",
      "Status": colony.isActive ? "Active" : "Inactive",
      "Created Date": colony.createdAtIST || colony.createdAt || "",
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const colWidths = [
      { wch: 30 }, // Name
      { wch: 10 }, // Pincode
      { wch: 40 }, // Address
      { wch: 20 }, // City
      { wch: 25 }, // Landmark
      { wch: 40 }, // Description
      { wch: 10 }, // Status
      { wch: 20 }, // Created Date
    ];
    worksheet['!cols'] = colWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Colonies");
    
    // Generate Excel file
    XLSX.writeFile(workbook, `colonies_export_${Date.now()}.xlsx`);
  }
};

// Bulk delete colonies
export const bulkDeleteColonies = async (colonyIds) => {
  const { data } = await http.post("/api/colonies/bulk-delete", { colonyIds });
  return data;
};
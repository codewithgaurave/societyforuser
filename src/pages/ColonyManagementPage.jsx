// src/pages/ColonyManagementPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FaCity,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaRegClock,
  FaMapMarkerAlt,
  FaFileExcel,
  FaFileImport,
  FaFileExport,
  FaDownload,
  FaUpload,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  listColonies,
  createColony,
  updateColony,
  deleteColony,
  importFromExcel,
  downloadTemplate,
  exportToExcel,
} from "../apis/colonies"; // Updated APIs
import Swal from "sweetalert2";

const fmtDateTime = (d) => {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "-";
  }
};

const emptyForm = {
  name: "",
  address: "",
  city: "",
  pincode: "",
  landmark: "",
  description: "",
  isActive: true,
};

export default function ColonyManagementPage() {
  const { themeColors } = useTheme();

  const [colonies, setColonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Excel Import States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  // ===== LOADERS =====
  const loadColonies = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listColonies();
      setColonies(list || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load colonies.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColonies();
  }, []);

  // unique city options
  const cityOptions = useMemo(() => {
    const cities = colonies?.map((c) => c.city).filter(Boolean) ?? [];
    return Array.from(new Set(cities));
  }, [colonies]);

  // ===== FILTERED COLONIES =====
  const filteredColonies = useMemo(() => {
    let list = colonies || [];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((c) =>
        [c.name, c.address, c.city, c.landmark, c.pincode, c.description]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q))
      );
    }

    if (filterCity !== "all") {
      list = list.filter((c) => (c.city || "") === filterCity);
    }

    if (filterStatus === "active") {
      list = list.filter((c) => c.isActive === true);
    } else if (filterStatus === "inactive") {
      list = list.filter((c) => c.isActive === false);
    }

    return list;
  }, [colonies, search, filterCity, filterStatus]);

  // ===== EXCEL FUNCTIONS =====

  // Download Sample Template
  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
      toast.success("Template downloaded successfully");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to download template";
      toast.error(msg);
    }
  };

  // Export Colonies to Excel
  const handleExportColonies = async () => {
    try {
      const dataToExport = filteredColonies.length > 0 ? filteredColonies : colonies;
      
      if (dataToExport.length === 0) {
        toast.warning("No data to export");
        return;
      }

      await exportToExcel(dataToExport);
      toast.success(`Exported ${dataToExport.length} colonies successfully`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to export";
      toast.error(msg);
    }
  };

  // Handle File Selection for Import
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast.error("Please select an Excel file (.xlsx, .xls, .csv)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    
    // Preview first 5 rows
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const XLSX = window.XLSX || require('xlsx');
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setPreviewData(jsonData.slice(0, 5));
      } catch (error) {
        console.error("Preview error:", error);
        toast.warning("Cannot preview file. Make sure it's a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Import Excel File
  const handleImportSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setImporting(true);
      const result = await importFromExcel(selectedFile);
      
      setImportResult(result);
      
      if (result.summary?.imported > 0) {
        toast.success(`Successfully imported ${result.summary.imported} colonies`);
        // Reload colonies list
        await loadColonies();
      }
      
      // If all failed or duplicates
      if (result.summary?.failed > 0 || result.summary?.duplicates > 0) {
        const msg = [];
        if (result.summary.failed > 0) msg.push(`${result.summary.failed} failed`);
        if (result.summary.duplicates > 0) msg.push(`${result.summary.duplicates} duplicates skipped`);
        toast.warning(`Import completed with: ${msg.join(', ')}`);
      }
      
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to import file";
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  // Reset Import Modal
  const resetImportModal = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
    setImportModalOpen(false);
  };

  // ===== FORM HANDLERS =====
  const resetForm = () => {
    setForm(emptyForm);
    setMode("create");
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setMode("create");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Colony name is required");
      return;
    }
    if (!form.city.trim()) {
      toast.error("City is required");
      return;
    }
    if (!form.pincode) {
      toast.error("Pincode is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        landmark: form.landmark,
        description: form.description,
        isActive: form.isActive,
      };

      if (mode === "create") {
        const res = await createColony(payload);
        const newColony = res?.colony || res?.data || res;

        if (newColony && newColony._id) {
          setColonies((prev) => [newColony, ...(prev || [])]);
        } else {
          await loadColonies();
        }

        toast.success(res?.message || "Colony created successfully");
        closeModal();
      } else if (mode === "edit" && editingId) {
        const res = await updateColony(editingId, payload);
        const updated = res?.colony || res?.data || res;

        if (updated && updated._id) {
          setColonies((prev) =>
            (prev || []).map((c) => (c._id === editingId ? updated : c))
          );
        } else {
          await loadColonies();
        }

        toast.success(res?.message || "Colony updated successfully");
        closeModal();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save colony.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ===== ROW ACTIONS =====
  const handleEditClick = (colony) => {
    setMode("edit");
    setEditingId(colony._id || null);
    setForm({
      name: colony.name || "",
      address: colony.address || "",
      city: colony.city || "",
      pincode: colony.pincode || "",
      landmark: colony.landmark || "",
      description: colony.description || "",
      isActive: typeof colony.isActive === "boolean" ? colony.isActive : true,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (colony) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete colony "${colony.name}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteColony(colony._id);
      toast.success(res?.message || "Colony deleted successfully");
      setColonies((prev) => (prev || []).filter((c) => c._id !== colony._id));
      if (editingId === colony._id) resetForm();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete colony.";
      toast.error(msg);
    }
  };

  // ===== UI STATES =====
  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4" style={{ color: themeColors.text }}>
            Loading colonies...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-lg border"
        style={{
          borderColor: themeColors.border,
          color: themeColors.danger,
          backgroundColor: themeColors.surface,
        }}
      >
        {error}
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaCity />
            Colonies Management
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Yaha se aap colonies add, edit, activate/deactivate aur delete kar sakte ho.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportColonies}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border"
            style={{
              borderColor: themeColors.success,
              backgroundColor: themeColors.success + "10",
              color: themeColors.success,
            }}
          >
            <FaFileExport className="text-xs" />
            Export Excel
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border"
            style={{
              borderColor: themeColors.primary,
              backgroundColor: themeColors.primary + "10",
              color: themeColors.primary,
            }}
          >
            <FaFileImport className="text-xs" />
            Import Excel
          </button>

          <button
            type="button"
            onClick={loadColonies}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.surface,
              color: themeColors.text,
            }}
          >
            <FaSyncAlt className="text-xs" />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.onPrimary,
            }}
          >
            <FaPlus className="text-xs" />
            Add Colony
          </button>
        </div>
      </div>

      {/* List Card */}
      <div
        className="rounded-2xl border shadow-sm p-4 md:p-5 flex flex-col"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        {/* Search + Count */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-xs" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, address, pincode..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>
          <div
            className="text-xs opacity-70 shrink-0 text-right"
            style={{ color: themeColors.text }}
          >
            Total: <span className="font-semibold">{colonies?.length || 0}</span>
            <br />
            Filtered:{" "}
            <span className="font-semibold">{filteredColonies.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* City Filter */}
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs md:text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">All Cities</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs md:text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: themeColors.background + "30",
                }}
              >
                {[
                  "Name",
                  "City",
                  "Pincode",
                  "Address",
                  "Landmark",
                  "Status",
                  "Created",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: themeColors.border }}
            >
              {filteredColonies.map((c) => (
                <tr key={c._id}>
                  <td
                    className="px-4 py-2 font-medium"
                    style={{ color: themeColors.text }}
                  >
                    <div className="flex items-center gap-1">
                      <FaMapMarkerAlt className="text-[11px] opacity-70" />
                      <span>{c.name || "-"}</span>
                    </div>
                  </td>
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: themeColors.text }}
                  >
                    {c.city || "-"}
                  </td>
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: themeColors.text }}
                  >
                    {c.pincode || "-"}
                  </td>
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: themeColors.text }}
                  >
                    {c.address || "-"}
                  </td>
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: themeColors.text }}
                  >
                    {c.landmark || "-"}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: c.isActive
                          ? themeColors.success + "20"
                          : themeColors.danger + "15",
                        color: c.isActive
                          ? themeColors.success
                          : themeColors.danger,
                      }}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td
                    className="px-4 py-2 text-[11px]"
                    style={{ color: themeColors.text }}
                  >
                    {fmtDateTime(c.createdAtIST || c.createdAt)}
                  </td>
                </tr>
              ))}

              {filteredColonies.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No colonies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL: CREATE / EDIT ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={saving ? undefined : closeModal}
          />

          {/* Modal Card */}
          <div
            className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl border shadow-lg max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2
                className="text-base font-semibold flex items-center gap-2"
                style={{ color: themeColors.text }}
              >
                {mode === "create" ? (
                  <>
                    <FaPlus /> Add Colony
                  </>
                ) : (
                  <>
                    <FaEdit /> Edit Colony
                  </>
                )}
              </h2>
              <button
                type="button"
                onClick={saving ? undefined : closeModal}
                className="text-xl leading-none px-2 py-1 rounded-md"
                style={{
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                }}
              >
                ×
              </button>
            </div>

            <div className="px-4 py-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* ... existing form fields ... */}
                {/* (Keep your existing form fields exactly as they are) */}
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    Colony Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Green Valley Colony"
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    disabled={saving}
                    required
                  />
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    value={form.address}
                    onChange={handleInputChange}
                    placeholder="Near Central Park"
                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    disabled={saving}
                  />
                </div>

                {/* City + Pincode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="city"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={form.city}
                      onChange={handleInputChange}
                      placeholder="Mumbai"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                      disabled={saving}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pincode"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      Pincode
                    </label>
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      value={form.pincode}
                      onChange={handleInputChange}
                      placeholder="400001"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                      disabled={saving}
                      required
                    />
                  </div>
                </div>

                {/* Landmark + Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="landmark"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      Landmark
                    </label>
                    <input
                      id="landmark"
                      name="landmark"
                      type="text"
                      value={form.landmark}
                      onChange={handleInputChange}
                      placeholder="City Mall"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      value={form.description}
                      onChange={handleInputChange}
                      placeholder="Premium society with all facilities"
                      className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleInputChange}
                    disabled={saving}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    Colony is Active
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={saving ? undefined : closeModal}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold border"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md"
                    style={{
                      backgroundColor: themeColors.primary,
                      color: themeColors.onPrimary,
                    }}
                  >
                    {saving ? (
                      <>
                        <FaRegClock className="animate-spin" />
                        Saving...
                      </>
                    ) : mode === "create" ? (
                      <>
                        <FaPlus />
                        Add Colony
                      </>
                    ) : (
                      <>
                        <FaEdit />
                        Update Colony
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: EXCEL IMPORT ===== */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={importing ? undefined : resetImportModal}
          />

          {/* Modal Card */}
          <div
            className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl border shadow-lg max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2
                className="text-base font-semibold flex items-center gap-2"
                style={{ color: themeColors.text }}
              >
                <FaFileImport />
                Import Colonies from Excel
              </h2>
              <button
                type="button"
                onClick={importing ? undefined : resetImportModal}
                className="text-xl leading-none px-2 py-1 rounded-md"
                style={{
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                }}
              >
                ×
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Instructions */}
              <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border + "50", backgroundColor: themeColors.background + "50" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: themeColors.primary }}>Instructions:</p>
                <ul className="text-xs space-y-1" style={{ color: themeColors.text }}>
                  <li>• Download the template file first to see the format</li>
                  <li>• Only .xlsx, .xls, and .csv files are supported</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>• Required columns: <strong>Name</strong> and <strong>Pincode</strong></li>
                  <li>• Optional columns: Address, City, Landmark, Description</li>
                </ul>
              </div>

              {/* Download Template Button */}
              <div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border"
                  style={{
                    borderColor: themeColors.success,
                    backgroundColor: themeColors.success + "10",
                    color: themeColors.success,
                  }}
                >
                  <FaDownload className="text-xs" />
                  Download Sample Template
                </button>
              </div>

              {/* File Upload */}
              <div>
                <label className="block mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: themeColors.text }}>
                  Select Excel File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    disabled={importing}
                  />
                </div>
                {selectedFile && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: themeColors.success }}>
                    <FaFileExcel />
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                  </p>
                )}
              </div>

              {/* Preview */}
              {previewData.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: themeColors.text }}>Preview (First 5 rows):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border" style={{ borderColor: themeColors.border }}>
                      <thead>
                        <tr style={{ backgroundColor: themeColors.background + "50" }}>
                          {Object.keys(previewData[0] || {}).map((key) => (
                            <th key={key} className="px-2 py-1 border" style={{ borderColor: themeColors.border }}>
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((value, i) => (
                              <td key={i} className="px-2 py-1 border" style={{ borderColor: themeColors.border }}>
                                {String(value || "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Results */}
              {importResult && (
                <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: themeColors.primary }}>Import Results:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div style={{ color: themeColors.success }}>✓ Imported: <strong>{importResult.summary?.imported || 0}</strong></div>
                    <div style={{ color: themeColors.danger }}>✗ Failed: <strong>{importResult.summary?.failed || 0}</strong></div>
                    <div style={{ color: themeColors.warning }}>⚠ Duplicates: <strong>{importResult.summary?.duplicates || 0}</strong></div>
                    <div>📊 Total: <strong>{importResult.summary?.totalRecords || 0}</strong></div>
                  </div>
                  
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1" style={{ color: themeColors.danger }}>Errors:</p>
                      <div className="max-h-32 overflow-y-auto text-xs" style={{ color: themeColors.text }}>
                        {importResult.errors.slice(0, 10).map((error, idx) => (
                          <div key={idx} className="py-1 border-b" style={{ borderColor: themeColors.border + "30" }}>
                            {error}
                          </div>
                        ))}
                        {importResult.errors.length > 10 && (
                          <div className="py-1 text-xs opacity-70">
                            ... and {importResult.errors.length - 10} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetImportModal}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text,
                  }}
                  disabled={importing}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={!selectedFile || importing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: themeColors.primary,
                    color: themeColors.onPrimary,
                  }}
                >
                  {importing ? (
                    <>
                      <FaRegClock className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      Import Colonies
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
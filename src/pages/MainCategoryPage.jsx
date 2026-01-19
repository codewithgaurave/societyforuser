// src/pages/MainCategoryPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaRegClock,
  FaObjectGroup,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { listServiceCategories } from "../apis/serviceCategory";
import {
  listMainCategories,
  createMainCategory,
  updateMainCategory,
  deleteMainCategory,
} from "../apis/mainCategory";

const fmtDateTime = (value) => {
  if (!value) return "-";

  const dateSource =
    typeof value === "string"
      ? value
      : value?.createdAtIST ||
        value?.updatedAtIST ||
        value?.createdAt ||
        value?.updatedAt;

  if (!dateSource) return "-";

  try {
    const dt = new Date(dateSource);
    if (Number.isNaN(dt.getTime())) return dateSource; // already formatted string
    return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "-";
  }
};

export default function MainCategoryPage() {
  const { themeColors } = useTheme();

  const [mainCategories, setMainCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    serviceCategoryIds: [],
  });

  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm({ name: "", description: "", serviceCategoryIds: [] });
    setMode("create");
    setEditingId(null);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1) Load main categories (admin)
      const mainCats = await listMainCategories();
      const rawMainList = Array.isArray(mainCats)
        ? mainCats
        : mainCats?.mainCategories || mainCats?.data || [];

      // Normalize: ensure every mainCategory has `id`
      const mainList =
        rawMainList?.map((c) => ({
          ...c,
          id: c.id || c._id,
          serviceCategories: Array.isArray(c.serviceCategories)
            ? c.serviceCategories.map((s) => ({
                ...s,
                id: s.id || s._id || s,
              }))
            : [],
        })) || [];

      setMainCategories(mainList || []);

      // 2) Load service categories (for dropdown)
      const resSvc = await listServiceCategories();
      const rawSvcList = Array.isArray(resSvc)
        ? resSvc
        : resSvc?.categories || resSvc?.data || [];

      // Normalize: ensure every serviceCategory has `id`
      const svcList =
        rawSvcList?.map((s) => ({
          ...s,
          id: s.id || s._id,
        })) || [];

      setServiceCategories(svcList || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load main categories.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMainCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mainCategories || [];

    return (mainCategories || []).filter((c) =>
      [
        c.name,
        c.description,
        ...(Array.isArray(c.serviceCategories)
          ? c.serviceCategories.map((s) => s?.name || "")
          : []),
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .some((v) => v.includes(q))
    );
  }, [mainCategories, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Main category name is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        serviceCategoryIds: form.serviceCategoryIds || [],
      };

      if (mode === "create") {
        const res = await createMainCategory(payload);
        let newCategory = res?.mainCategory || res?.data || res;

        if (newCategory) {
          // normalize id + nested serviceCategories
          newCategory = {
            ...newCategory,
            id: newCategory.id || newCategory._id,
            serviceCategories: Array.isArray(newCategory.serviceCategories)
              ? newCategory.serviceCategories.map((s) => ({
                  ...s,
                  id: s.id || s._id || s,
                }))
              : [],
          };

          setMainCategories((prev) => [newCategory, ...(prev || [])]);
        }

        toast.success(res?.message || "Main category created successfully");
        resetForm();
      } else if (mode === "edit" && editingId) {
        const res = await updateMainCategory(editingId, payload);

        let updated = res?.mainCategory || res?.data || res;
        if (updated) {
          // normalize id + nested serviceCategories
          updated = {
            ...updated,
            id: updated.id || updated._id,
            serviceCategories: Array.isArray(updated.serviceCategories)
              ? updated.serviceCategories.map((s) => ({
                  ...s,
                  id: s.id || s._id || s,
                }))
              : [],
          };

          setMainCategories((prev) =>
            (prev || []).map((c) => (c.id === editingId ? updated : c))
          );
        }

        toast.success(res?.message || "Main category updated successfully");
        resetForm();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save main category.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (category) => {
    setMode("edit");
    setEditingId(category.id);

    const serviceCategoryIds = Array.isArray(category.serviceCategories)
      ? category.serviceCategories.map((s) => s.id || s._id || s)
      : [];

    setForm({
      name: category.name || "",
      description: category.description || "",
      serviceCategoryIds,
    });
  };

  const handleDeleteClick = async (category) => {
    const ok = window.confirm(
      `Are you sure you want to delete main category "${category.name}"?`
    );
    if (!ok) return;

    try {
      const res = await deleteMainCategory(category.id);
      toast.success(res?.message || "Main category deleted successfully");
      setMainCategories((prev) =>
        (prev || []).filter((c) => c.id !== category.id)
      );

      if (editingId === category.id) {
        resetForm();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete main category.";
      toast.error(msg);
    }
  };

  // ======= UI STATES =======
  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4" style={{ color: themeColors.text }}>
            Loading main categories...
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

  // Helper: show service category names inside table
  const getServiceCategoryNames = (category) => {
    if (!Array.isArray(category.serviceCategories)) return "-";

    const names = category.serviceCategories
      .map((s) => s?.name || s?.title || "")
      .filter(Boolean);

    return names.length ? names.join(", ") : "-";
  };

  // ======= MAIN RENDER =======
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaObjectGroup />
            Main Categories
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Yaha se aap main categories create, edit, delete kar sakte ho aur
            service categories assign kar sakte ho.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
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
      </div>

      {/* Main layout: Form + List */}
      <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-6">
        {/* Form Card */}
        <div
          className="rounded-2xl border shadow-sm p-4 md:p-5"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-semibold flex items-center gap-2"
              style={{ color: themeColors.text }}
            >
              {mode === "create" ? (
                <>
                  <FaPlus /> Create Main Category
                </>
              ) : (
                <>
                  <FaEdit /> Edit Main Category
                </>
              )}
            </h2>

            {mode === "edit" && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold px-2 py-1 rounded-md border"
                style={{
                  borderColor: themeColors.border,
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                style={{ color: themeColors.text }}
              >
                Main Category Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Home Services"
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
                htmlFor="description"
                className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                style={{ color: themeColors.text }}
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="All home related services like plumbing, electrician, cleaning..."
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 transition-all"
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
                className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                style={{ color: themeColors.text }}
              >
                Service Categories
              </label>
              <p
                className="text-[11px] mb-2 opacity-70"
                style={{ color: themeColors.text }}
              >
                Multiple subcategories select kar sakte ho. Selected: {form.serviceCategoryIds.length}
              </p>
              
              {/* Checkbox-style multi-select */}
              <div 
                className="w-full max-h-[150px] overflow-y-auto border rounded-lg p-2 space-y-1"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                }}
              >
                {serviceCategories.length > 0 ? (
                  serviceCategories.map((svc) => {
                    const isSelected = form.serviceCategoryIds.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        className="flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-opacity-50 transition-colors"
                        style={{
                          backgroundColor: isSelected ? themeColors.primary + '20' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setForm(prev => ({
                              ...prev,
                              serviceCategoryIds: checked 
                                ? [...prev.serviceCategoryIds, svc.id]
                                : prev.serviceCategoryIds.filter(id => id !== svc.id)
                            }));
                          }}
                          className="mt-0.5 rounded"
                          disabled={saving}
                        />
                        <div className="flex-1">
                          <div 
                            className="text-sm font-medium"
                            style={{ color: themeColors.text }}
                          >
                            {svc.name || "Unnamed"}
                          </div>
                          {svc.description && (
                            <div 
                              className="text-xs opacity-70 mt-0.5"
                              style={{ color: themeColors.text }}
                            >
                              {svc.description}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div 
                    className="text-sm text-center py-4 opacity-70"
                    style={{ color: themeColors.text }}
                  >
                    No service categories found
                  </div>
                )}
              </div>
              
              {/* Select All / Clear All buttons */}
              {serviceCategories.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      serviceCategoryIds: serviceCategories.map(s => s.id)
                    }))}
                    className="text-xs px-2 py-1 rounded border"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    disabled={saving}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      serviceCategoryIds: []
                    }))}
                    className="text-xs px-2 py-1 rounded border"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    disabled={saving}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md"
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
                  Create Main Category
                </>
              ) : (
                <>
                  <FaEdit />
                  Update Main Category
                </>
              )}
            </button>
          </form>
        </div>

        {/* List Card */}
        <div
          className="rounded-2xl border shadow-sm p-4 md:p-5 flex flex-col"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          {/* Search */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-xs" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search main category by name, description or service category"
                className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                }}
              />
            </div>
            <div className="text-xs opacity-70" style={{ color: themeColors.text }}>
              Total:{" "}
              <span className="font-semibold">{mainCategories?.length || 0}</span>
            </div>
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
                    "Description",
                    "Service Categories",
                    "Active",
                    "Created",
                    "Updated",
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
                {filteredMainCategories.map((c) => (
                  <tr key={c.id}>
                    <td
                      className="px-4 py-2 font-medium"
                      style={{ color: themeColors.text }}
                    >
                      {c.name || "-"}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {c.description || "-"}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {getServiceCategoryNames(c)}
                    </td>
                    <td
                      className="px-4 py-2 text-xs font-semibold"
                      style={{
                        color: c.isActive
                          ? themeColors.success || "#16a34a"
                          : themeColors.danger || "#dc2626",
                      }}
                    >
                      {c.isActive ? "YES" : "NO"}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {fmtDateTime(c.createdAtIST || c.createdAt)}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {fmtDateTime(c.updatedAtIST || c.updatedAt)}
                    </td>
                  </tr>
                ))}

                {filteredMainCategories.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm"
                      style={{ color: themeColors.text }}
                    >
                      No main categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

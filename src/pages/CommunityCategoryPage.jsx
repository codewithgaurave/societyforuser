import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FaListUl,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaCircle,
  FaCheck,
  FaTimes,
  FaDatabase,
  FaShoppingCart,
  FaPaw,
  FaCar,
  FaCalendarAlt,
  FaBullhorn,
  FaLightbulb,
  FaUsers,
  FaThumbsUp,
  FaHandsHelping,
  FaTint,
  FaAmbulance,
  FaComments
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  listAdminCategories,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  seedCategoriesApi
} from "../apis/community";

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

const getCategoryIcon = (iconName, value) => {
  const key = `${iconName || ""} ${value || ""}`.toLowerCase();
  if (key.includes("shop") || key.includes("sell") || key.includes("cart")) return <FaShoppingCart />;
  if (key.includes("search") || key.includes("lost")) return <FaSearch />;
  if (key.includes("pet") || key.includes("paw")) return <FaPaw />;
  if (key.includes("car")) return <FaCar />;
  if (key.includes("calendar") || key.includes("event") || key.includes("celebrat")) return <FaCalendarAlt />;
  if (key.includes("megaphone") || key.includes("notice") || key.includes("campaign")) return <FaBullhorn />;
  if (key.includes("bulb") || key.includes("light") || key.includes("idea") || key.includes("suggest")) return <FaLightbulb />;
  if (key.includes("people") || key.includes("rwa") || key.includes("group") || key.includes("user")) return <FaUsers />;
  if (key.includes("like") || key.includes("appreciat") || key.includes("thumb")) return <FaThumbsUp />;
  if (key.includes("volunteer") || key.includes("hand")) return <FaHandsHelping />;
  if (key.includes("blood") || key.includes("drop") || key.includes("tint")) return <FaTint />;
  if (key.includes("emergency") || key.includes("ambulance")) return <FaAmbulance />;
  return <FaComments />;
};

export default function CommunityCategoryPage() {
  const { themeColors } = useTheme();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Form state
  const [form, setForm] = useState({
    label: "",
    value: "",
    subtitle: "",
    icon: "message",
    color: "#6366F1",
    order: 0,
    isActive: true
  });

  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm({
      label: "",
      value: "",
      subtitle: "",
      icon: "message",
      color: "#6366F1",
      order: 0,
      isActive: true
    });
    setMode("create");
    setEditingId(null);
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listAdminCategories();
      setCategories(list || []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load community categories.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories || [];

    return (categories || []).filter((c) =>
      [c.label, c.value, c.subtitle, c.icon]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .some((v) => v.includes(q))
    );
  }, [categories, search]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);

  const handleLabelChange = (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const updates = { ...prev, label: val };
      if (mode === "create") {
        updates.value = val
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .replace(/_+/g, "_");
      }
      return updates;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.label.trim()) {
      toast.error("Category label is required");
      return;
    }
    if (!form.value.trim()) {
      toast.error("Category value is required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        label: form.label.trim(),
        value: form.value.trim().toLowerCase(),
        subtitle: form.subtitle ? form.subtitle.trim() : "",
        icon: form.icon.trim(),
        color: form.color.trim(),
        order: Number(form.order) || 0,
        isActive: form.isActive
      };

      if (mode === "create") {
        const res = await createCategoryApi(payload);
        const newCategory = res?.category || res?.data || res;
        if (newCategory) {
          setCategories((prev) => [...prev, newCategory]);
        }
        toast.success(res?.message || "Category created successfully");
        resetForm();
      } else if (mode === "edit" && editingId) {
        const res = await updateCategoryApi(editingId, payload);
        const updated = res?.category || res?.data || res;
        if (updated) {
          setCategories((prev) =>
            prev.map((c) => ((c._id || c.id) === editingId ? updated : c))
          );
        }
        toast.success(res?.message || "Category updated successfully");
        resetForm();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (category) => {
    setMode("edit");
    setEditingId(category._id || category.id);
    setForm({
      label: category.label || "",
      value: category.value || "",
      subtitle: category.subtitle || "",
      icon: category.icon || "message",
      color: category.color || "#6366F1",
      order: category.order || 0,
      isActive: category.isActive !== false
    });
  };

  const handleToggleStatus = async (category) => {
    const categoryId = category._id || category.id;
    try {
      const updatedStatus = !category.isActive;
      const res = await updateCategoryApi(categoryId, { ...category, isActive: updatedStatus });
      const updated = res?.category || res?.data || res;
      if (updated) {
        setCategories((prev) =>
          prev.map((c) => ((c._id || c.id) === categoryId ? updated : c))
        );
      }
      toast.success(`Category set to ${updatedStatus ? "Active" : "Inactive"}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to toggle category status");
    }
  };

  const handleDeleteClick = async (category) => {
    const ok = window.confirm(`Are you sure you want to delete category "${category.label}"?`);
    if (!ok) return;

    try {
      const categoryId = category._id || category.id;
      const res = await deleteCategoryApi(categoryId);
      toast.success(res?.message || "Category deleted successfully");
      setCategories((prev) => prev.filter((c) => (c._id || c.id) !== categoryId));
      if (editingId === categoryId) {
        resetForm();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete category");
    }
  };

  const handleSeedDefaults = async () => {
    const ok = window.confirm("Are you sure you want to seed/update the 12 default community categories (Sell/Give Away, Lost & Found, Pet Care, Car Pool, Events, Notice Board, Suggestions, RWA, Appreciations, Volunteer, Blood Donation, Emergency Help)?");
    if (!ok) return;

    try {
      setLoading(true);
      const res = await seedCategoriesApi();
      toast.success(res?.message || "Default 12 categories seeded successfully!");
      loadCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to seed default categories");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4" style={{ color: themeColors.text }}>
            Loading community categories...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border text-center" style={{ borderColor: themeColors.border, color: themeColors.danger, backgroundColor: themeColors.surface }}>
        <p className="font-semibold">{error}</p>
        <button onClick={loadCategories} className="mt-2 px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ borderColor: themeColors.border, color: themeColors.text }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaListUl />
            Community Support Categories
          </h1>
          <p className="text-sm mt-1 opacity-75" style={{ color: themeColors.text }}>
            Manage tiles UI and support categories for residents (Sell Items, Lost & Found, Car Pool, Blood Donation, Pet Care, etc.)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedDefaults}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
            style={{ borderColor: themeColors.border }}
          >
            <FaDatabase className="text-xs" />
            Seed 12 Default Categories
          </button>

          <button
            onClick={loadCategories}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border"
            style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface, color: themeColors.text }}
          >
            <FaSyncAlt className="text-xs" />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Preview of Community Support Tiles (Matching App UI) */}
      <div className="rounded-2xl border shadow-sm p-4 md:p-5" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: themeColors.text }}>
              Live App UI Preview — Community Support Tiles
            </h2>
          </div>
          <span className="text-xs opacity-60 font-medium" style={{ color: themeColors.text }}>
            {categories.filter(c => c.isActive).length} Active Tiles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(categories.length > 0 ? categories.filter(c => c.isActive) : []).map((cat) => {
            const color = cat.color || "#6366F1";
            return (
              <div
                key={cat._id || cat.id || cat.value}
                className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3 transition-transform hover:-translate-y-0.5"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 text-base shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {getCategoryIcon(cat.icon, cat.value)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 truncate" title={cat.label}>
                    {cat.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight mt-0.5" title={cat.subtitle}>
                    {cat.subtitle || "कम्युनिटी सपोर्ट और सहायता"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Layout: Left form, Right List */}
      <div className="grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6">
        {/* Form Card */}
        <div className="rounded-2xl border shadow-sm p-4 md:p-5" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: themeColors.text }}>
              {mode === "create" ? <><FaPlus /> Create Category</> : <><FaEdit /> Edit Category</>}
            </h2>

            {mode === "edit" && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold px-2 py-1 rounded-md border"
                style={{ borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.background }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: themeColors.text }}>
                Category Title (English)
              </label>
              <input
                type="text"
                name="label"
                value={form.label}
                onChange={handleLabelChange}
                placeholder="e.g. Sell / Give Away Used Items"
                className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: themeColors.text }}>
                Subtitle / Description (Hindi)
              </label>
              <input
                type="text"
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                placeholder="e.g. अपने उपयोग की चीजें बेचें या किसी को मुफ्त दें।"
                className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: themeColors.text }}>
                Value Key (Slug)
              </label>
              <input
                type="text"
                name="value"
                value={form.value}
                onChange={handleChange}
                placeholder="e.g. sell_giveaway"
                className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
                disabled={mode === "edit"}
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: themeColors.text }}>
                Icon Identifier
              </label>
              <input
                type="text"
                name="icon"
                value={form.icon}
                onChange={handleChange}
                placeholder="e.g. shop, search_normal, pets, car, calendar, megaphone, lightbulb, people, like, volunteer, blood, emergency"
                className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: themeColors.text }}>
                Tile Color (Hex)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="#6366F1"
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: themeColors.text }}>
                Sort Order
              </label>
              <input
                type="number"
                name="order"
                value={form.order}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="isActive" className="text-xs font-semibold cursor-pointer" style={{ color: themeColors.text }}>
                Category is Active
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow transition-all duration-150 flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColors.primary || "#6366F1" }}
            >
              {saving ? (
                <>Saving...</>
              ) : mode === "create" ? (
                <><FaPlus /> Create Category</>
              ) : (
                <><FaEdit /> Update Category</>
              )}
            </button>
          </form>
        </div>

        {/* Categories Table List */}
        <div className="rounded-2xl border shadow-sm p-4 md:p-5 flex flex-col justify-between" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold" style={{ color: themeColors.text }}>
                Categories ({filteredCategories.length})
              </h2>

              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-60">
                  <FaSearch className="text-xs" style={{ color: themeColors.text }} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories or subtitles..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <tr>
                    {["Tile", "Title", "Subtitle (Hindi)", "Slug", "Order", "Status", "Actions"].map((head) => (
                      <th key={head} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: themeColors.text }}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                  {paginatedCategories.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-xs opacity-75" style={{ color: themeColors.text }}>
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    paginatedCategories.map((c) => (
                      <tr key={c._id || c.id}>
                        <td className="px-3 py-2 text-xs">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shadow-xs"
                            style={{ backgroundColor: c.color || "#6366F1" }}
                          >
                            {getCategoryIcon(c.icon, c.value)}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-semibold text-xs" style={{ color: themeColors.text }}>
                          {c.label}
                        </td>
                        <td className="px-3 py-2 text-[11px] max-w-[180px] truncate" style={{ color: themeColors.textSecondary }} title={c.subtitle}>
                          {c.subtitle || "-"}
                        </td>
                        <td className="px-3 py-2 text-[11px] font-mono opacity-80" style={{ color: themeColors.textSecondary }}>
                          {c.value}
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold" style={{ color: themeColors.text }}>
                          {c.order ?? 0}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors duration-150"
                            style={{
                              backgroundColor: c.isActive ? themeColors.success + "15" : themeColors.danger + "15",
                              color: c.isActive ? themeColors.success : themeColors.danger
                            }}
                          >
                            {c.isActive ? <><FaCheck className="text-[8px]" /> Active</> : <><FaTimes className="text-[8px]" /> Inactive</>}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(c)}
                              title="Edit"
                              className="p-1.5 rounded hover:bg-gray-100 transition-colors duration-150"
                              style={{ color: themeColors.primary }}
                            >
                              <FaEdit className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(c)}
                              title="Delete"
                              className="p-1.5 rounded hover:bg-gray-100 transition-colors duration-150"
                              style={{ color: themeColors.danger }}
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between mt-4" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <span className="text-xs opacity-75" style={{ color: themeColors.text }}>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs rounded border disabled:opacity-50"
                  style={{ borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.surface }}
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs rounded border disabled:opacity-50"
                  style={{ borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.surface }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// src/pages/ServiceCategoryPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FaListUl,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaRegClock,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  listServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from "../apis/serviceCategory";

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

export default function ServiceCategoryPage() {
  const { themeColors } = useTheme();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // form state
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setMode("create");
    setEditingId(null);
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await listServiceCategories();

      // response could be array OR { categories: [...] }
      const list = Array.isArray(res)
        ? res
        : res?.categories || res?.data || [];

      setCategories(list || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load service categories.";
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
      [c.name, c.description]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .some((v) => v.includes(q))
    );
  }, [categories, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSaving(true);

      if (mode === "create") {
        const res = await createServiceCategory({
          name: form.name.trim(),
          description: form.description.trim(),
        });

        const newCategory = res?.category || res?.data || res;
        if (newCategory) {
          setCategories((prev) => [newCategory, ...(prev || [])]);
        }

        toast.success(res?.message || "Category created successfully");
        resetForm();
      } else if (mode === "edit" && editingId) {
        const res = await updateServiceCategory(editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
        });

        const updated = res?.category || res?.data || res;
        if (updated) {
          setCategories((prev) =>
            (prev || []).map((c) => (c.id === editingId ? updated : c))
          );
        }

        toast.success(res?.message || "Category updated successfully");
        resetForm();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save category.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (category) => {
    setMode("edit");
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      description: category.description || "",
    });
  };

  const handleDeleteClick = async (category) => {
    const ok = window.confirm(
      `Are you sure you want to delete category "${category.name}"?`
    );
    if (!ok) return;

    try {
      const res = await deleteServiceCategory(category.id);
      toast.success(res?.message || "Category deleted successfully");
      setCategories((prev) => (prev || []).filter((c) => c.id !== category.id));

      // if we were editing this, reset form
      if (editingId === category.id) {
        resetForm();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete category.";
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
            Loading service categories...
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
            <FaListUl />
            Service Categories
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Yaha se aap service categories create, edit aur delete kar sakte ho.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCategories}
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
      <div className="grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6">
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
                  <FaPlus /> Create Category
                </>
              ) : (
                <>
                  <FaEdit /> Edit Category
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
                Category Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Electrician"
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
                placeholder="All electrician related services..."
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                }}
                disabled={saving}
              />
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
                  Create Category
                </>
              ) : (
                <>
                  <FaEdit />
                  Update Category
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
                placeholder="Search category by name or description"
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
              <span className="font-semibold">{categories?.length || 0}</span>
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
                  {["Name", "Description", "Created", "Updated"].map(
                    (head) => (
                      <th
                        key={head}
                        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: themeColors.text }}
                      >
                        {head}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: themeColors.border }}
              >
                {filteredCategories.map((c) => (
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
                      {fmtDateTime(c.createdAt)}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {fmtDateTime(c.updatedAt)}
                    </td>
                  </tr>
                ))}

                {filteredCategories.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm"
                      style={{ color: themeColors.text }}
                    >
                      No categories found.
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

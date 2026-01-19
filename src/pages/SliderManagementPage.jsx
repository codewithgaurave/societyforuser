// src/pages/SliderManagementPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FaImages,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaRegClock,
  FaToggleOn,
  FaToggleOff,
  FaLink,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  listSliders,
  createSlider,
  updateSlider,
  deleteSlider,
} from "../apis/sliders";
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
  title: "",
  description: "",
  targetUrl: "",
  sortOrder: "",
  isActive: true,
  sliderImageFile: null,
  sliderImageUrl: "",
};

export default function SliderManagementPage() {
  const { themeColors } = useTheme();

  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | active | inactive

  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ===== LOADERS =====
  const loadSliders = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listSliders();
      setSliders(list || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load sliders.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSliders();
  }, []);

  // ===== FILTERED LIST =====
  const filteredSliders = useMemo(() => {
    let list = sliders || [];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((s) =>
        [s.title, s.description, s.targetUrl, s.sortOrder]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q))
      );
    }

    if (filterStatus === "active") {
      list = list.filter((s) => s.isActive === true);
    } else if (filterStatus === "inactive") {
      list = list.filter((s) => s.isActive === false);
    }

    return list;
  }, [sliders, search, filterStatus]);

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

  const handleTextChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, sliderImageFile: null }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      sliderImageFile: file,
      sliderImageUrl: previewUrl,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (mode === "create" && !form.sliderImageFile) {
      toast.error("Slider image is required");
      return;
    }

    const payload = {
      sliderImage: form.sliderImageFile,
      title: form.title,
      description: form.description,
      targetUrl: form.targetUrl,
      sortOrder: form.sortOrder || 0,
      isActive: form.isActive,
    };

    try {
      setSaving(true);

      if (mode === "create") {
        const res = await createSlider(payload);
        const newSlider = res?.slider || res?.data || res;

        if (newSlider && newSlider._id) {
          setSliders((prev) => [newSlider, ...(prev || [])]);
        } else {
          await loadSliders();
        }

        toast.success(res?.message || "Slider created successfully");
        closeModal();
      } else if (mode === "edit" && editingId) {
        // image optional in update
        if (!form.sliderImageFile) {
          delete payload.sliderImage;
        }

        const res = await updateSlider(editingId, payload);
        const updated = res?.slider || res?.data || res;

        if (updated && updated._id) {
          setSliders((prev) =>
            (prev || []).map((s) => (s._id === editingId ? updated : s))
          );
        } else {
          await loadSliders();
        }

        toast.success(res?.message || "Slider updated successfully");
        closeModal();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save slider.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ===== ROW ACTIONS =====
  const handleEditClick = (slider) => {
    setMode("edit");
    setEditingId(slider._id || null);

    setForm({
      title: slider.title || "",
      description: slider.description || "",
      targetUrl: slider.targetUrl || "",
      sortOrder:
        slider.sortOrder !== undefined && slider.sortOrder !== null
          ? String(slider.sortOrder)
          : "",
      isActive:
        typeof slider.isActive === "boolean" ? slider.isActive : true,
      sliderImageFile: null,
      sliderImageUrl: slider.sliderImage || slider.imageUrl || "",
    });

    setIsModalOpen(true);
  };

  const handleDeleteClick = async (slider) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete slider "${slider.title}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteSlider(slider._id);
      toast.success(res?.message || "Slider deleted successfully");
      setSliders((prev) => (prev || []).filter((s) => s._id !== slider._id));
      if (editingId === slider._id) resetForm();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete slider.";
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
            Loading sliders...
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
            <FaImages />
            Sliders Management
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Yaha se aap home page ke sliders add, edit, activate/deactivate
            aur delete kar sakte ho.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSliders}
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
            Add Slider
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
              placeholder="Search by title, description, target URL..."
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
            Total: <span className="font-semibold">{sliders?.length || 0}</span>
            <br />
            Filtered:{" "}
            <span className="font-semibold">{filteredSliders.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
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
                  "Image",
                  "Title",
                  "Description",
                  "Target URL",
                  "Sort",
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
              {filteredSliders.map((s) => (
                <tr key={s._id}>
                  {/* Image */}
                  <td className="px-4 py-2">
                    <div className="h-14 w-24 rounded-md overflow-hidden border flex items-center justify-center text-[11px]"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    >
                      {s.sliderImage || s.imageUrl ? (
                        <img
                          src={s.sliderImage || s.imageUrl}
                          alt={s.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "No image"
                      )}
                    </div>
                  </td>

                  {/* Title */}
                  <td
                    className="px-4 py-2 font-medium"
                    style={{ color: themeColors.text }}
                  >
                    {s.title || "-"}
                  </td>

                  {/* Description */}
                  <td
                    className="px-4 py-2 text-xs max-w-xs"
                    style={{ color: themeColors.text }}
                  >
                    <div className="line-clamp-2">{s.description || "-"}</div>
                  </td>

                  {/* Target URL */}
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: themeColors.text }}
                  >
                    {s.targetUrl ? (
                      <a
                        href={s.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 underline"
                      >
                        <FaLink className="text-[10px]" />
                        <span className="truncate max-w-[180px]">
                          {s.targetUrl}
                        </span>
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* SortOrder */}
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: themeColors.text }}
                  >
                    {s.sortOrder ?? "-"}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1"
                      style={{
                        backgroundColor: s.isActive
                          ? themeColors.success + "20"
                          : themeColors.danger + "15",
                        color: s.isActive
                          ? themeColors.success
                          : themeColors.danger,
                      }}
                    >
                      {s.isActive ? (
                        <>
                          <FaToggleOn className="text-[12px]" /> Active
                        </>
                      ) : (
                        <>
                          <FaToggleOff className="text-[12px]" /> Inactive
                        </>
                      )}
                    </span>
                  </td>

                  {/* Created */}
                  <td
                    className="px-4 py-2 text-[11px]"
                    style={{ color: themeColors.text }}
                  >
                    {fmtDateTime(s.createdAtIST || s.createdAt)}
                  </td>
                </tr>
              ))}

              {filteredSliders.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No sliders found.
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
                    <FaPlus /> Add Slider
                  </>
                ) : (
                  <>
                    <FaEdit /> Edit Slider
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
                {/* Image upload + preview */}
                <div>
                  <label
                    htmlFor="sliderImage"
                    className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    Slider Image {mode === "create" && <span>*</span>}
                  </label>
                  <input
                    id="sliderImage"
                    name="sliderImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={saving}
                    className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 hover:file:bg-gray-200"
                    style={{ color: themeColors.text }}
                  />
                  {(form.sliderImageUrl) && (
                    <div className="mt-2">
                      <span
                        className="text-[11px] opacity-70"
                        style={{ color: themeColors.text }}
                      >
                        Preview:
                      </span>
                      <div className="mt-1 h-24 w-full max-w-xs rounded-md overflow-hidden border"
                        style={{
                          borderColor: themeColors.border,
                          backgroundColor: themeColors.background,
                        }}
                      >
                        <img
                          src={form.sliderImageUrl}
                          alt="Slider preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleTextChange}
                    placeholder="Welcome Banner"
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

                {/* Description */}
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
                    onChange={handleTextChange}
                    placeholder="Special offers for society members"
                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    disabled={saving}
                  />
                </div>

                {/* Target URL + SortOrder */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="targetUrl"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      Target URL
                    </label>
                    <input
                      id="targetUrl"
                      name="targetUrl"
                      type="text"
                      value={form.targetUrl}
                      onChange={handleTextChange}
                      placeholder="https://example.com/offers"
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
                      htmlFor="sortOrder"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      Sort Order
                    </label>
                    <input
                      id="sortOrder"
                      name="sortOrder"
                      type="number"
                      value={form.sortOrder}
                      onChange={handleTextChange}
                      placeholder="1"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                      disabled={saving}
                      min={0}
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
                    onChange={handleTextChange}
                    disabled={saving}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    Slider is Active
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
                        Add Slider
                      </>
                    ) : (
                      <>
                        <FaEdit />
                        Update Slider
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

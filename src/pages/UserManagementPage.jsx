// src/pages/UserManagementPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaLock,
  FaLockOpen,
  FaRegClock,
  FaEye,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaImage,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  listUsers,
  registerUser,
  updateUserBlockStatus,
  adminUpdateUser,
  deleteUser,
  getUserDetails, // ✅ NEW IMPORT
} from "../apis/users";
import { listServiceCategories } from "../apis/serviceCategory";
import Swal from "sweetalert2"; // SweetAlert2 import

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

const fmtDate = (d) => {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return "-";
  }
};

const emptyForm = {
  fullName: "",
  mobileNumber: "",
  whatsappNumber: "",
  email: "",
  password: "",
  address: "",
  pincode: "",
  role: "society member", // default
  serviceCategory: "",
  experience: "",
  adharCard: "",
  serviceCharge: "",
  perHourCharge: "",
  tatkalEnabled: false,
};

export default function UserManagementPage() {
  const { themeColors } = useTheme();

  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // 🔽 Filter states
  const [filterRole, setFilterRole] = useState("all");
  const [filterServiceCategory, setFilterServiceCategory] = useState("all");
  const [filterBlocked, setFilterBlocked] = useState("all"); // all | active | blocked

  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🔍 View Details states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewDetails, setViewDetails] = useState(null); // { user, availability, holidays, templates, ... }

  // ===== LOADERS =====
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listUsers();
      setUsers(list || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load users.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await listServiceCategories();
      const list = Array.isArray(res)
        ? res
        : res?.categories || res?.data || [];
      setCategories(list || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load service categories.";
      toast.error(msg);
    }
  };

  useEffect(() => {
    loadUsers();
    loadCategories();
  }, []);

  // Service category options (unique from categories + users)
  const serviceCategoryOptions = useMemo(() => {
    const fromCats = categories?.map((c) => c.name).filter(Boolean) ?? [];
    const fromUsers = users?.map((u) => u.serviceCategory).filter(Boolean) ?? [];
    return Array.from(new Set([...fromCats, ...fromUsers]));
  }, [categories, users]);

  // ===== FILTER USERS =====
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users || [];

    // search
    if (q) {
      list = list.filter((u) =>
        [
          u.fullName,
          u.email,
          u.mobileNumber,
          u.whatsappNumber,
          u.role,
          u.serviceCategory,
          u.registrationID,
          u.pincode,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q))
      );
    }

    // role filter
    if (filterRole !== "all") {
      list = list.filter((u) => (u.role || "").toLowerCase() === filterRole);
    }

    // service category filter
    if (filterServiceCategory !== "all") {
      list = list.filter(
        (u) => (u.serviceCategory || "") === filterServiceCategory
      );
    }

    // blocked / active filter
    if (filterBlocked === "blocked") {
      list = list.filter((u) => u.isBlocked === true);
    } else if (filterBlocked === "active") {
      list = list.filter((u) => !u.isBlocked);
    }

    return list;
  }, [users, search, filterRole, filterServiceCategory, filterBlocked]);

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
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: e.target.checked }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setForm((prev) => ({
      ...prev,
      role,
      ...(role !== "society service"
        ? {
            serviceCategory: "",
            experience: "",
            serviceCharge: "",
            perHourCharge: "",
          }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!form.mobileNumber) {
      toast.error("Mobile number is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (mode === "create" && !form.password.trim()) {
      toast.error("Password is required for new user");
      return;
    }

    if (
      form.role === "society service" &&
      !form.serviceCategory.toString().trim()
    ) {
      toast.error("Service category is required for society service");
      return;
    }

    try {
      setSaving(true);

      if (mode === "create") {
        const payload = {
          ...form,
          mobileNumber: form.mobileNumber,
          whatsappNumber: form.whatsappNumber || form.mobileNumber,
          pincode: form.pincode,
        };

        const res = await registerUser(payload);
        const newUser = res?.user || res?.data || res;

        if (newUser && newUser._id) {
          setUsers((prev) => [newUser, ...(prev || [])]);
        } else {
          await loadUsers();
        }

        toast.success(res?.message || "User registered successfully");
        closeModal();
      } else if (mode === "edit" && editingId) {
        const { password, ...restForm } = form;

        const payload = {
          ...restForm,
          mobileNumber: restForm.mobileNumber,
          whatsappNumber: restForm.whatsappNumber || restForm.mobileNumber,
          pincode: restForm.pincode,
        };

        const res = await adminUpdateUser(editingId, payload);
        const updated = res?.user || res?.data || res;

        if (updated && updated._id) {
          setUsers((prev) =>
            (prev || []).map((u) => (u._id === editingId ? updated : u))
          );
        } else {
          await loadUsers();
        }

        toast.success(res?.message || "User updated successfully");
        closeModal();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to save user.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ===== VIEW DETAILS HANDLER =====
  const openViewModal = async (user) => {
    setIsViewModalOpen(true);
    setViewDetails(null);
    setViewLoading(true);

    try {
      const res = await getUserDetails(user._id);
      setViewDetails(res || {});
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load user details.";
      toast.error(msg);
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewDetails(null);
  };

  // ===== ROW ACTIONS =====
  const handleEditClick = (user) => {
    setMode("edit");
    setEditingId(user._id);

    setForm({
      ...emptyForm,
      fullName: user.fullName || "",
      mobileNumber: user.mobileNumber || "",
      whatsappNumber: user.whatsappNumber || "",
      email: user.email || "",
      password: "",
      address: user.address || "",
      pincode: user.pincode || "",
      role: user.role || "society member",
      serviceCategory: user.serviceCategory || "",
      experience: user.experience || "",
      adharCard: user.adharCard || "",
      serviceCharge: user.serviceCharge || "",
      perHourCharge: user.perHourCharge || "",
      tatkalEnabled: Boolean(user.tatkalEnabled),
    });

    setIsModalOpen(true);
  };

  const handleDeleteClick = async (user) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete user "${user.fullName}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await deleteUser(user._id);
      toast.success(res?.message || "User deleted successfully");
      setUsers((prev) => (prev || []).filter((u) => u._id !== user._id));

      if (editingId === user._id) {
        resetForm();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete user.";
      toast.error(msg);
    }
  };

  const handleBlockToggle = async (user) => {
    const newStatus = !user.isBlocked;

    try {
      const res = await updateUserBlockStatus(user._id, newStatus);
      const updated = res?.user || res?.data;

      setUsers((prev) =>
        (prev || []).map((u) =>
          u._id === user._id
            ? {
                ...u,
                ...(updated || {}),
                isBlocked:
                  typeof updated?.isBlocked === "boolean"
                    ? updated.isBlocked
                    : newStatus,
              }
            : u
        )
      );

      toast.success(
        res?.message ||
          (newStatus
            ? "User blocked successfully"
            : "User unblocked successfully")
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update block status.";
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
            Loading users...
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
            <FaUsers />
            Users Management
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Yaha se aap users register, edit, block/unblock aur delete kar sakte
            ho.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
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
            Add User
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
        {/* Search & count */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-xs" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, mobile, role, category, registration ID..."
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
            Total: <span className="font-semibold">{users?.length || 0}</span>
            <br />
            Filtered:{" "}
            <span className="font-semibold">{filteredUsers.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs md:text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">All Roles</option>
            <option value="society member">Society Member</option>
            <option value="society service">Society Service</option>
          </select>

          {/* Service Category filter */}
          <select
            value={filterServiceCategory}
            onChange={(e) => setFilterServiceCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs md:text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">All Service Categories</option>
            {serviceCategoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Blocked / Active filter */}
          <select
            value={filterBlocked}
            onChange={(e) => setFilterBlocked(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs md:text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active (Unblocked)</option>
            <option value="blocked">Blocked</option>
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
                  "Mobile",
                  "Email",
                  "Role",
                  "Service Category",
                  "Tatkal",
                  "Blocked",
                  "Created",
                  "Actions",
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
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td
                    className="px-4 py-2 font-medium"
                    style={{ color: themeColors.text }}
                  >
                    <div className="flex flex-col">
                      <span>{u.fullName || "-"}</span>
                      {u.registrationID && (
                        <span className="text-[11px] opacity-70">
                          ID: {u.registrationID}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className="px-4 py-2"
                    style={{ color: themeColors.text }}
                  >
                    <div className="flex flex-col text-xs">
                      <span>{u.mobileNumber || "-"}</span>
                      {u.whatsappNumber && (
                        <span className="opacity-70">
                          WhatsApp: {u.whatsappNumber}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: themeColors.text }}
                  >
                    {u.email || "-"}
                  </td>
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: themeColors.text }}
                  >
                    {u.role || "-"}
                  </td>
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: themeColors.text }}
                  >
                    {u.serviceCategory || "-"}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: u.tatkalEnabled
                          ? themeColors.success + "20"
                          : themeColors.border,
                        color: u.tatkalEnabled
                          ? themeColors.success
                          : themeColors.text,
                      }}
                    >
                      {u.tatkalEnabled ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1"
                      style={{
                        backgroundColor: u.isBlocked
                          ? themeColors.danger + "15"
                          : themeColors.success + "15",
                        color: u.isBlocked
                          ? themeColors.danger
                          : themeColors.success,
                      }}
                    >
                      {u.isBlocked ? (
                        <>
                          <FaLock className="text-[10px]" /> Blocked
                        </>
                      ) : (
                        <>
                          <FaLockOpen className="text-[10px]" /> Active
                        </>
                      )}
                    </span>
                  </td>
                  <td
                    className="px-4 py-2 text-[11px]"
                    style={{ color: themeColors.text }}
                  >
                    {fmtDateTime(u.createdAtIST || u.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* ✅ View button */}
                      <button
                        type="button"
                        onClick={() => openViewModal(u)}
                        className="px-2 py-1 rounded-md border inline-flex items-center gap-1"
                        style={{
                          borderColor: themeColors.border,
                          backgroundColor: themeColors.background,
                          color: themeColors.text,
                        }}
                      >
                        <FaEye className="text-[11px]" />
                        <span className="text-[11px]">View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBlockToggle(u)}
                        className="px-2 py-1 rounded-md border inline-flex items-center gap-1"
                        style={{
                          borderColor: u.isBlocked
                            ? themeColors.success
                            : themeColors.danger,
                          backgroundColor: themeColors.background,
                          color: u.isBlocked
                            ? themeColors.success
                            : themeColors.danger,
                        }}
                      >
                        {u.isBlocked ? (
                          <>
                            <FaLockOpen className="text-[11px]" />
                            <span className="text-[11px]">Unblock</span>
                          </>
                        ) : (
                          <>
                            <FaLock className="text-[11px]" />
                            <span className="text-[11px]">Block</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No users found.
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
                    <FaPlus /> Register User
                  </>
                ) : (
                  <>
                    <FaEdit /> Edit User
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
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleInputChange}
                    placeholder="Rahul Sharma"
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

                {/* Mobile + Whatsapp */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="mobileNumber"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      Mobile Number
                    </label>
                    <input
                      id="mobileNumber"
                      name="mobileNumber"
                      type="tel"
                      value={form.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="9000000000"
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
                      htmlFor="whatsappNumber"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      Whatsapp Number
                    </label>
                    <input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      type="tel"
                      value={form.whatsappNumber}
                      onChange={handleInputChange}
                      placeholder="same as mobile"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Email + Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="rahul@example.com"
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

                  {mode === "create" && (
                    <div>
                      <label
                        htmlFor="password"
                        className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: themeColors.text }}
                      >
                        Password
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleInputChange}
                        placeholder="******"
                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{
                          borderColor: themeColors.border,
                          backgroundColor: themeColors.background,
                          color: themeColors.text,
                        }}
                        disabled={saving}
                        required={mode === "create"}
                      />
                    </div>
                  )}
                </div>

                {/* Address + Pincode */}
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
                    placeholder="Flat 101, ABC Society"
                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    disabled={saving}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label
                      htmlFor="role"
                      className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={form.role}
                      onChange={handleRoleChange}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                      disabled={saving}
                    >
                      <option value="society member">Society Member</option>
                      <option value="society service">Society Service</option>
                    </select>
                  </div>
                </div>

                {/* Service fields (only for society service) */}
                {form.role === "society service" && (
                  <>
                    {/* Service Category with search (datalist) */}
                    <div>
                      <label
                        htmlFor="serviceCategory"
                        className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: themeColors.text }}
                      >
                        Service Category
                      </label>
                      <input
                        id="serviceCategory"
                        name="serviceCategory"
                        list="serviceCategoryList"
                        value={form.serviceCategory}
                        onChange={handleInputChange}
                        placeholder="Type to search category (e.g. Electrician)"
                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{
                          borderColor: themeColors.border,
                          backgroundColor: themeColors.background,
                          color: themeColors.text,
                        }}
                        disabled={saving}
                      />
                      <datalist id="serviceCategoryList">
                        {(categories || []).map((c) => (
                          <option key={c.id || c._id} value={c.name} />
                        ))}
                      </datalist>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="experience"
                          className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                          style={{ color: themeColors.text }}
                        >
                          Experience
                        </label>
                        <input
                          id="experience"
                          name="experience"
                          type="text"
                          value={form.experience}
                          onChange={handleInputChange}
                          placeholder="5 years"
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
                          htmlFor="adharCard"
                          className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                          style={{ color: themeColors.text }}
                        >
                          Aadhaar Card
                        </label>
                        <input
                          id="adharCard"
                          name="adharCard"
                          type="text"
                          value={form.adharCard}
                          onChange={handleInputChange}
                          placeholder="XXXX-XXXX-XXXX"
                          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{
                            borderColor: themeColors.border,
                            backgroundColor: themeColors.background,
                            color: themeColors.text,
                          }}
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="serviceCharge"
                          className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                          style={{ color: themeColors.text }}
                        >
                          Service Charge
                        </label>
                        <input
                          id="serviceCharge"
                          name="serviceCharge"
                          type="text"
                          value={form.serviceCharge}
                          onChange={handleInputChange}
                          placeholder="e.g. 500"
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
                          htmlFor="perHourCharge"
                          className="block mb-1 text-xs font-semibold uppercase tracking-wide"
                          style={{ color: themeColors.text }}
                        >
                          Per Hour Charge
                        </label>
                        <input
                          id="perHourCharge"
                          name="perHourCharge"
                          type="text"
                          value={form.perHourCharge}
                          onChange={handleInputChange}
                          placeholder="e.g. 200"
                          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{
                            borderColor: themeColors.border,
                            backgroundColor: themeColors.background,
                            color: themeColors.text,
                          }}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Tatkal Enabled */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="tatkalEnabled"
                    name="tatkalEnabled"
                    type="checkbox"
                    checked={form.tatkalEnabled}
                    onChange={handleInputChange}
                    disabled={saving}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="tatkalEnabled"
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    Tatkal Service Enabled
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
                        Register User
                      </>
                    ) : (
                      <>
                        <FaEdit />
                        Update User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: VIEW DETAILS ===== */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={viewLoading ? undefined : closeViewModal}
          />

          {/* Modal Card */}
          <div
            className="relative z-10 w-full max-w-4xl mx-4 rounded-2xl border shadow-lg max-h-[90vh] overflow-y-auto"
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
                <FaEye />
                User Details
              </h2>
              <button
                type="button"
                onClick={viewLoading ? undefined : closeViewModal}
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
              {viewLoading && !viewDetails && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto" />
                    <p
                      className="mt-3 text-sm"
                      style={{ color: themeColors.text }}
                    >
                      Loading details...
                    </p>
                  </div>
                </div>
              )}

              {!viewLoading && viewDetails && (
                <>
                  {/* Top: User summary */}
                  {(() => {
                    const u = viewDetails.user || {};
                    return (
                      <div
                        className="rounded-xl border p-3 md:p-4 flex gap-3"
                        style={{
                          borderColor: themeColors.border,
                          backgroundColor: themeColors.background,
                        }}
                      >
                        {/* Avatar */}
                        <div
                          className="h-16 w-16 rounded-full overflow-hidden border flex-shrink-0 flex items-center justify-center text-2xl font-semibold"
                          style={{
                            borderColor: themeColors.border,
                            backgroundColor: themeColors.surface,
                            color: themeColors.primary,
                          }}
                        >
                          {u.profileImage ? (
                            <img
                              src={u.profileImage}
                              alt={u.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (u.fullName || "?").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className="text-lg font-semibold"
                              style={{ color: themeColors.text }}
                            >
                              {u.fullName || "-"}
                            </h3>
                            {u.registrationID && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[11px] font-mono"
                                style={{
                                  backgroundColor: themeColors.surface,
                                  color: themeColors.text,
                                  border: `1px dashed ${themeColors.border}`,
                                }}
                              >
                                {u.registrationID}
                              </span>
                            )}
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                              style={{
                                backgroundColor: u.tatkalEnabled
                                  ? themeColors.success + "20"
                                  : themeColors.border,
                                color: u.tatkalEnabled
                                  ? themeColors.success
                                  : themeColors.text,
                              }}
                            >
                              Tatkal: {u.tatkalEnabled ? "Enabled" : "Disabled"}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                              style={{
                                backgroundColor: u.isBlocked
                                  ? themeColors.danger + "15"
                                  : themeColors.success + "15",
                                color: u.isBlocked
                                  ? themeColors.danger
                                  : themeColors.success,
                              }}
                            >
                              {u.isBlocked ? "Blocked" : "Active"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[11px] md:text-xs opacity-90">
                            {u.role && (
                              <span
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: themeColors.surface,
                                  color: themeColors.text,
                                  border: `1px solid ${themeColors.border}`,
                                }}
                              >
                                Role: {u.role}
                              </span>
                            )}
                            {u.serviceCategory && (
                              <span
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: themeColors.surface,
                                  color: themeColors.text,
                                  border: `1px solid ${themeColors.border}`,
                                }}
                              >
                                Service: {u.serviceCategory}
                              </span>
                            )}
                            {u.experience && (
                              <span
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: themeColors.surface,
                                  color: themeColors.text,
                                  border: `1px solid ${themeColors.border}`,
                                }}
                              >
                                Experience: {u.experience}{" "}
                                {Number(u.experience) ? "years" : ""}
                              </span>
                            )}
                            {(u.serviceCharge || u.perHourCharge) && (
                              <span
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: themeColors.surface,
                                  color: themeColors.text,
                                  border: `1px solid ${themeColors.border}`,
                                }}
                              >
                                Charges:{" "}
                                {u.serviceCharge &&
                                  `Service ₹${u.serviceCharge}`}{" "}
                                {u.serviceCharge && u.perHourCharge && " | "}
                                {u.perHourCharge &&
                                  `Per Hour ₹${u.perHourCharge}`}
                              </span>
                            )}
                          </div>

                          <div className="text-xs space-y-1 mt-1">
                            {u.email && (
                              <div style={{ color: themeColors.text }}>
                                Email:{" "}
                                <span className="font-semibold">
                                  {u.email}
                                </span>
                              </div>
                            )}
                            {(u.mobileNumber || u.whatsappNumber) && (
                              <div style={{ color: themeColors.text }}>
                                Phone:{" "}
                                <span className="font-semibold">
                                  {u.mobileNumber}
                                </span>
                                {u.whatsappNumber && (
                                  <>
                                    {" "}
                                    | WhatsApp:{" "}
                                    <span className="font-semibold">
                                      {u.whatsappNumber}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                            {(u.address || u.pincode) && (
                              <div
                                className="flex items-start gap-1"
                                style={{ color: themeColors.text }}
                              >
                                <FaMapMarkerAlt className="mt-[2px]" />
                                <span>
                                  {u.address && (
                                    <>
                                      {u.address}
                                      <br />
                                    </>
                                  )}
                                  {u.pincode && (
                                    <span>Pincode: {u.pincode}</span>
                                  )}
                                </span>
                              </div>
                            )}
                            <div
                              className="flex flex-wrap gap-3 text-[11px] opacity-80"
                              style={{ color: themeColors.text }}
                            >
                              <span>
                                Created:{" "}
                                {fmtDateTime(u.createdAtIST || u.createdAt)}
                              </span>
                              <span>
                                Updated:{" "}
                                {fmtDateTime(u.updatedAtIST || u.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Availability + Holidays + Templates */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Availability */}
                    <div
                      className="rounded-xl border p-3 md:p-4 flex flex-col"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className="text-sm font-semibold flex items-center gap-2"
                          style={{ color: themeColors.text }}
                        >
                          <FaCalendarAlt />
                          Availability
                        </h3>
                      </div>

                      {(!viewDetails.availability ||
                        viewDetails.availability.length === 0) && (
                        <p
                          className="text-xs opacity-70"
                          style={{ color: themeColors.text }}
                        >
                          No availability slots found.
                        </p>
                      )}

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {(viewDetails.availability || []).map((slot) => (
                          <div
                            key={slot._id}
                            className="rounded-lg border px-2 py-1.5 text-[11px] space-y-1"
                            style={{
                              borderColor: themeColors.border,
                              backgroundColor: themeColors.surface,
                              color: themeColors.text,
                            }}
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold">
                                {fmtDate(slot.date)}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <FaClock className="text-[10px]" />
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            {slot.notes && (
                              <div className="opacity-80">{slot.notes}</div>
                            )}
                            {slot.colonies && slot.colonies.length > 0 && (
                              <div className="text-[10px] opacity-90">
                                Colonies:
                                <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                                  {slot.colonies.map((c) => (
                                    <li key={c._id}>
                                      {c.name} ({c.pincode}) - {c.address}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Holidays */}
                    <div
                      className="rounded-xl border p-3 md:p-4 flex flex-col"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className="text-sm font-semibold flex items-center gap-2"
                          style={{ color: themeColors.text }}
                        >
                          <FaCalendarAlt />
                          Holidays
                        </h3>
                        {viewDetails.hasActiveHoliday && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              backgroundColor: themeColors.danger + "15",
                              color: themeColors.danger,
                            }}
                          >
                            Active Holiday
                          </span>
                        )}
                      </div>

                      {(!viewDetails.holidays ||
                        viewDetails.holidays.length === 0) && (
                        <p
                          className="text-xs opacity-70"
                          style={{ color: themeColors.text }}
                        >
                          No holidays found.
                        </p>
                      )}

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {(viewDetails.holidays || []).map((h) => (
                          <div
                            key={h._id}
                            className="rounded-lg border px-2 py-1.5 text-[11px] space-y-1"
                            style={{
                              borderColor: themeColors.border,
                              backgroundColor: themeColors.surface,
                              color: themeColors.text,
                            }}
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold">
                                {fmtDate(h.startDate)} → {fmtDate(h.endDate)}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded-full capitalize"
                                style={{
                                  backgroundColor: themeColors.background,
                                  border: `1px solid ${themeColors.border}`,
                                }}
                              >
                                {h.status}
                              </span>
                            </div>
                            {h.reason && (
                              <div className="opacity-80">{h.reason}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Templates */}
                  <div
                    className="rounded-xl border p-3 md:p-4"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className="text-sm font-semibold flex items-center gap-2"
                        style={{ color: themeColors.text }}
                      >
                        <FaImage />
                        Service Templates
                      </h3>
                      {viewDetails.hasTemplates && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{
                            backgroundColor: themeColors.primary + "20",
                            color: themeColors.primary,
                          }}
                        >
                          Active Templates
                        </span>
                      )}
                    </div>

                    {(!viewDetails.templates ||
                      viewDetails.templates.length === 0) && (
                      <p
                        className="text-xs opacity-70"
                        style={{ color: themeColors.text }}
                      >
                        No templates found.
                      </p>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-64 overflow-y-auto pr-1">
                      {(viewDetails.templates || []).map((tpl) => (
                        <div
                          key={tpl._id}
                          className="rounded-lg border overflow-hidden flex flex-col"
                          style={{
                            borderColor: themeColors.border,
                            backgroundColor: themeColors.surface,
                          }}
                        >
                          {tpl.imageUrl && (
                            <div className="h-24 w-full overflow-hidden">
                              <img
                                src={tpl.imageUrl}
                                alt={tpl.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-2 space-y-1">
                            <div
                              className="text-xs font-semibold line-clamp-1"
                              style={{ color: themeColors.text }}
                            >
                              {tpl.title}
                            </div>
                            {tpl.description && (
                              <div
                                className="text-[11px] line-clamp-2 opacity-80"
                                style={{ color: themeColors.text }}
                              >
                                {tpl.description}
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-1 text-[10px] opacity-80">
                              {tpl.serviceCategory && (
                                <span>{tpl.serviceCategory}</span>
                              )}
                              <span>
                                {fmtDate(tpl.createdAtIST || tpl.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

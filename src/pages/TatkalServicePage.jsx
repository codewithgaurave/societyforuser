// src/pages/TatkalServicePage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FaBolt,
  FaSearch,
  FaPhoneAlt,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaUserTie,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { listTatkalUsers } from "../apis/users";

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

export default function TatkalServicePage() {
  const { themeColors } = useTheme();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRole, setFilterRole] = useState("all");

  const loadTatkalUsers = async () => {
    try {
      setLoading(true);
      setError("");

      // listTatkalUsers() ab directly array return kar raha hai (users.js me normalize kiya hua)
      const res = await listTatkalUsers();
      const list = Array.isArray(res) ? res : res?.users || [];

      setUsers(list || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load tatkal users.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTatkalUsers();
  }, []);

  // unique service categories
  const serviceCategories = useMemo(() => {
    const cats = users?.map((u) => u.serviceCategory).filter(Boolean) ?? [];
    return Array.from(new Set(cats)).filter(cat => typeof cat === 'string');
  }, [users]);

  // ===== FILTERED LIST =====
  const filteredUsers = useMemo(() => {
    let list = users || [];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((u) =>
        [
          u.fullName,
          u.email,
          u.mobileNumber,
          u.whatsappNumber,
          u.serviceCategory,
          u.pincode,
          u.registrationID,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q))
      );
    }

    if (filterCategory !== "all") {
      list = list.filter((u) => u.serviceCategory === filterCategory);
    }

    if (filterRole !== "all") {
      list = list.filter(
        (u) => (u.role || "").toLowerCase() === filterRole.toLowerCase()
      );
    }

    // safety check: sirf tatkalEnabled aur unblocked users
    list = list.filter((u) => u.tatkalEnabled && !u.isBlocked);

    return list;
  }, [users, search, filterCategory, filterRole]);

  // ====== STATES ======
  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4" style={{ color: themeColors.text }}>
            Loading tatkal services...
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaBolt />
            Tatkal Services
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Tatkal enabled society service providers ki list. Emergency / urgent
            work ke liye yaha se contact kar sakte ho.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTatkalUsers}
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

      {/* Search + Filters */}
      <div
        className="rounded-2xl border shadow-sm p-4 md:p-5"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-xs" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, service category, mobile, pincode..."
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
            Total Tatkal:{" "}
            <span className="font-semibold">{users?.length || 0}</span>
            <br />
            Filtered:{" "}
            <span className="font-semibold">{filteredUsers.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Service Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs md:text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">All Service Categories</option>
            {serviceCategories.map((sc) => (
              <option key={sc} value={sc}>
                {sc}
              </option>
            ))}
          </select>

          {/* Role Filter */}
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
            <option value="society service">Society Service</option>
            <option value="society member">Society Member</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((u) => (
          <div
            key={u._id}
            className="rounded-2xl border shadow-sm p-4 flex flex-col"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            {/* Top: avatar + name + category */}
            <div className="flex gap-3">
              {/* Avatar */}
              <div
                className="h-14 w-14 rounded-full overflow-hidden border flex-shrink-0 flex items-center justify-center text-xl font-semibold"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
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

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2
                    className="text-base font-semibold"
                    style={{ color: themeColors.text }}
                  >
                    {String(u.fullName || "")}
                  </h2>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold gap-1"
                    style={{
                      backgroundColor: themeColors.primary + "20",
                      color: themeColors.primary,
                    }}
                  >
                    <FaBolt className="text-[10px]" />
                    Tatkal
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-[11px] opacity-80">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                  >
                    <FaUserTie className="text-[10px]" />
                    {String(u.serviceCategory || "Service")}
                  </span>
                  {u.role && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    >
                      Role: {String(u.role || "")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle: details */}
            <div className="mt-3 space-y-1 text-xs">
              {u.experience && (
                <div
                  className="flex justify-between"
                  style={{ color: themeColors.text }}
                >
                  <span className="opacity-70">Experience:</span>
                  <span className="font-semibold">
                    {String(u.experience || "")} {Number(u.experience) ? "years" : ""}
                  </span>
                </div>
              )}

              {(u.serviceCharge || u.perHourCharge) && (
                <div
                  className="flex justify-between"
                  style={{ color: themeColors.text }}
                >
                  <span className="opacity-70">Charges:</span>
                  <span className="font-semibold text-right">
                    {u.serviceCharge && `Service: ₹${String(u.serviceCharge)}`}{" "}
                    {u.serviceCharge && u.perHourCharge && " | "}
                    {u.perHourCharge && `Per Hour: ₹${String(u.perHourCharge)}`}
                  </span>
                </div>
              )}

              {u.pincode && (
                <div
                  className="flex justify-between items-center"
                  style={{ color: themeColors.text }}
                >
                  <span className="opacity-70 flex items-center gap-1">
                    <FaMapMarkerAlt className="text-[10px]" />
                    Pincode:
                  </span>
                  <span className="font-semibold">{String(u.pincode || "")}</span>
                </div>
              )}

              {u.registrationID && (
                <div
                  className="flex justify-between"
                  style={{ color: themeColors.text }}
                >
                  <span className="opacity-70">Reg. ID:</span>
                  <span className="font-mono text-[11px]">
                    {String(u.registrationID || "")}
                  </span>
                </div>
              )}

              <div
                className="flex justify-between text-[11px] opacity-75"
                style={{ color: themeColors.text }}
              >
                <span>Joined:</span>
                <span>{fmtDateTime(u.createdAtIST || u.createdAt)}</span>
              </div>
            </div>

            {/* Bottom: contact buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {u.mobileNumber && (
                <a
                  href={`tel:${u.mobileNumber}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text,
                  }}
                >
                  <FaPhoneAlt className="text-[11px]" />
                  Call
                </a>
              )}

              {u.whatsappNumber && (
                <a
                  href={`https://wa.me/${u.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    backgroundColor: "#25D36620",
                    color: "#25D366",
                  }}
                >
                  <FaWhatsapp className="text-[11px]" />
                  WhatsApp
                </a>
              )}

              {u.email && (
                <a
                  href={`mailto:${u.email}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text,
                  }}
                >
                  ✉ Email
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div
          className="text-center text-sm py-8 rounded-2xl border"
          style={{
            borderColor: themeColors.border,
            backgroundColor: themeColors.surface,
            color: themeColors.text,
          }}
        >
          Abhi koi tatkal service provider nahi mila. Thoda baad me check karo
          ya filters clear karke dekho.
        </div>
      )}
    </div>
  );
}

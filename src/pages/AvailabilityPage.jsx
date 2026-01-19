// src/pages/AvailabilityPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaSyncAlt,
  FaUser,
  FaMapMarkerAlt,
  FaBolt,
  FaCheck,
  FaTimes,
  FaPhoneAlt,
} from "react-icons/fa";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { listAvailability } from "../apis/availability";

const fmtDateOnly = (d) => {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return "-";
  }
};

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

export default function AvailabilityPage() {
  const { themeColors } = useTheme();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterTatkal, setFilterTatkal] = useState("all"); // all | yes | no
  const [filterStatus, setFilterStatus] = useState("all"); // all | available | unavailable

  // ===== LOAD DATA =====
  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listAvailability();
      setItems(list || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load availability.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  // unique service categories
  const serviceCategories = useMemo(() => {
    const cats =
      items?.map((a) => a.user?.serviceCategory).filter(Boolean) ?? [];
    return Array.from(new Set(cats));
  }, [items]);

  // ===== FILTERED LIST =====
  const filteredItems = useMemo(() => {
    let list = items || [];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((a) => {
        const u = a.user || {};
        const colonies = a.colonies || [];
        const textParts = [
          u.fullName,
          u.mobileNumber,
          u.role,
          u.serviceCategory,
          a.notes,
          ...colonies.map((c) => c.name),
          ...colonies.map((c) => c.city),
          ...colonies.map((c) => c.pincode),
        ];

        return textParts
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q));
      });
    }

    if (filterCategory !== "all") {
      list = list.filter(
        (a) => (a.user?.serviceCategory || "") === filterCategory
      );
    }

    if (filterTatkal === "yes") {
      list = list.filter((a) => a.user?.tatkalEnabled === true);
    } else if (filterTatkal === "no") {
      list = list.filter((a) => !a.user?.tatkalEnabled);
    }

    if (filterStatus === "available") {
      list = list.filter((a) => a.isAvailable === true);
    } else if (filterStatus === "unavailable") {
      list = list.filter((a) => a.isAvailable === false);
    }

    // sort by date + startTime for better UX
    list = [...list].sort((a, b) => {
      const da = new Date(a.date || 0).getTime();
      const db = new Date(b.date || 0).getTime();
      if (da !== db) return da - db;
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return 0;
    });

    return list;
  }, [items, search, filterCategory, filterTatkal, filterStatus]);

  // ===== UI STATES =====
  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4" style={{ color: themeColors.text }}>
            Loading availability...
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
            <FaCalendarAlt />
            Availability
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Society service providers ki availability list – date, time,
            colonies aur notes sab yaha se dekh sakte ho.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAvailability}
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
        {/* Search + count */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-xs" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, mobile, service category, colony, notes..."
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
            Total: <span className="font-semibold">{items?.length || 0}</span>
            <br />
            Filtered:{" "}
            <span className="font-semibold">{filteredItems.length}</span>
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

          {/* Tatkal Filter */}
          <select
            value={filterTatkal}
            onChange={(e) => setFilterTatkal(e.target.value)}
            className="px-3 py-2 rounded-lg border text-xs md:text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">Tatkal: All</option>
            <option value="yes">Tatkal: Yes</option>
            <option value="no">Tatkal: No</option>
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
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((a) => {
          const user = a.user || {};
          const colonies = a.colonies || [];

          return (
            <div
              key={a._id}
              className="rounded-2xl border shadow-sm p-4 flex flex-col"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              }}
            >
              {/* Top: date/time + status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-xs opacity-80" />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: themeColors.text }}
                    >
                      {fmtDateOnly(a.date)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <FaClock className="text-[11px] opacity-70" />
                    <span style={{ color: themeColors.text }}>
                      {a.startTime} - {a.endTime}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1"
                    style={{
                      backgroundColor: a.isAvailable
                        ? themeColors.success + "20"
                        : themeColors.danger + "15",
                      color: a.isAvailable
                        ? themeColors.success
                        : themeColors.danger,
                    }}
                  >
                    {a.isAvailable ? (
                      <>
                        <FaCheck className="text-[10px]" />
                        Available
                      </>
                    ) : (
                      <>
                        <FaTimes className="text-[10px]" />
                        Unavailable
                      </>
                    )}
                  </span>

                  {user.tatkalEnabled && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1"
                      style={{
                        backgroundColor: themeColors.primary + "20",
                        color: themeColors.primary,
                      }}
                    >
                      <FaBolt className="text-[10px]" />
                      Tatkal
                    </span>
                  )}
                </div>
              </div>

              {/* User info */}
              <div className="mt-3 border-t pt-3 text-xs space-y-1"
                style={{ borderColor: themeColors.border }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-[11px] opacity-80" />
                    <span
                      className="font-semibold"
                      style={{ color: themeColors.text }}
                    >
                      {user.fullName || "-"}
                    </span>
                  </div>
                  {user.mobileNumber && (
                    <a
                      href={`tel:${user.mobileNumber}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    >
                      <FaPhoneAlt className="text-[10px]" />
                      Call
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {user.role && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                      style={{
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    >
                      Role: {user.role}
                    </span>
                  )}
                  {user.serviceCategory && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                      style={{
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    >
                      Category: {user.serviceCategory}
                    </span>
                  )}
                </div>
              </div>

              {/* Colonies */}
              {colonies.length > 0 && (
                <div className="mt-3 text-xs">
                  <div
                    className="mb-1 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1"
                    style={{ color: themeColors.text }}
                  >
                    <FaMapMarkerAlt className="text-[10px]" />
                    Colonies
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {colonies.map((c) => (
                      <div
                        key={c._id}
                        className="px-2 py-1 rounded-lg border text-[11px]"
                        style={{
                          borderColor: themeColors.border,
                          backgroundColor: themeColors.background,
                          color: themeColors.text,
                        }}
                      >
                        <div className="font-semibold">{c.name}</div>
                        <div className="opacity-80">
                          {c.address}, {c.city} - {c.pincode}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes + meta */}
              <div className="mt-3 text-[11px] space-y-1">
                {a.notes && (
                  <div
                    className="px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                  >
                    <span className="font-semibold">Notes: </span>
                    <span>{a.notes}</span>
                  </div>
                )}

                <div
                  className="flex justify-between opacity-70"
                  style={{ color: themeColors.text }}
                >
                  <span>Created:</span>
                  <span>{fmtDateTime(a.createdAtIST || a.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div
          className="text-center text-sm py-8 rounded-2xl border"
          style={{
            borderColor: themeColors.border,
            backgroundColor: themeColors.surface,
            color: themeColors.text,
          }}
        >
          Abhi koi availability records nahi mile. Thoda baad me check karo ya
          filters clear karke dekho.
        </div>
      )}
    </div>
  );
}

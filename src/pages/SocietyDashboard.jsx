// src/pages/SocietyDashboard.jsx
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FaUserFriends,
  FaUserShield,
  FaUsersCog,
  FaUserSlash,
  FaBuilding,
  FaSearch,
  FaCheckCircle,
  FaRegClock,
  FaBan,
  FaUser,
  FaUserTie,
  FaPhoneAlt,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

// ✅ PURE DUMMY / STATIC DATA (no APIs)
const DUMMY_MEMBERS = [
  {
    id: "m1",
    flatNumber: "A-101",
    name: "Rahul Sharma",
    phone: "9876543210",
    email: "rahul.sharma@example.com",
    status: "ACTIVE",
    familyCount: 4,
    vehicleCount: 2,
    createdAt: "2024-09-10T09:30:00Z",
  },
  {
    id: "m2",
    flatNumber: "B-204",
    name: "Neha Verma",
    phone: "9898989898",
    email: "neha.verma@example.com",
    status: "INACTIVE",
    familyCount: 3,
    vehicleCount: 1,
    createdAt: "2024-08-05T14:10:00Z",
  },
  {
    id: "m3",
    flatNumber: "C-305",
    name: "Amit Patel",
    phone: "9123456780",
    email: "amit.patel@example.com",
    status: "BLOCKED",
    familyCount: 2,
    vehicleCount: 0,
    createdAt: "2024-07-20T18:45:00Z",
  },
  {
    id: "m4",
    flatNumber: "D-110",
    name: "Priya Singh",
    phone: "9000000001",
    email: "priya.singh@example.com",
    status: "ACTIVE",
    familyCount: 5,
    vehicleCount: 3,
    createdAt: "2024-10-01T11:15:00Z",
  },
];

const DUMMY_WORKERS = [
  {
    id: "w1",
    name: "Ramesh Kumar",
    type: "Security Guard",
    role: "Gate Security",
    employeeCode: "SEC-001",
    phone: "9811111111",
    shift: "Morning (7 AM - 3 PM)",
    status: "ON_DUTY",
    lastCheckInAt: "2024-10-20T07:05:00Z",
  },
  {
    id: "w2",
    name: "Suresh Yadav",
    type: "Housekeeping",
    role: "Cleaning Staff",
    employeeCode: "HK-002",
    phone: "9822222222",
    shift: "Evening (3 PM - 11 PM)",
    status: "OFF_DUTY",
    lastCheckInAt: "2024-10-19T22:15:00Z",
  },
  {
    id: "w3",
    name: "Mahesh Gupta",
    type: "Maintenance",
    role: "Electrician",
    employeeCode: "MT-003",
    phone: "9833333333",
    shift: "General (10 AM - 6 PM)",
    status: "ON_DUTY",
    lastCheckInAt: "2024-10-20T10:10:00Z",
  },
  {
    id: "w4",
    name: "Imran Khan",
    type: "Security Guard",
    role: "Tower Security",
    employeeCode: "SEC-004",
    phone: "9844444444",
    shift: "Night (11 PM - 7 AM)",
    status: "BLOCKED",
    lastCheckInAt: "2024-09-15T23:55:00Z",
  },
];

const MEMBER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "BLOCKED", label: "Blocked" },
];

const WORKER_STATUS_OPTIONS = [
  { value: "ON_DUTY", label: "On Duty" },
  { value: "OFF_DUTY", label: "Off Duty" },
  { value: "BLOCKED", label: "Blocked" },
];

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

function getStatusChip(status, themeColors, type = "member") {
  const s = String(status || "").toUpperCase();

  if (type === "member") {
    if (s === "ACTIVE") {
      return {
        icon: <FaCheckCircle />,
        bg: themeColors.success + "20",
        color: themeColors.success,
        label: "Active",
      };
    }
    if (s === "BLOCKED") {
      return {
        icon: <FaBan />,
        bg: themeColors.danger + "20",
        color: themeColors.danger,
        label: "Blocked",
      };
    }
    return {
      icon: <FaRegClock />,
      bg: themeColors.border,
      color: themeColors.text,
      label: "Inactive",
    };
  }

  // worker
  if (s === "ON_DUTY") {
    return {
      icon: <FaCheckCircle />,
      bg: themeColors.success + "20",
      color: themeColors.success,
      label: "On Duty",
    };
  }
  if (s === "BLOCKED") {
    return {
      icon: <FaBan />,
      bg: themeColors.danger + "20",
      color: themeColors.danger,
      label: "Blocked",
    };
  }
  return {
    icon: <FaRegClock />,
    bg: themeColors.border,
    color: themeColors.text,
    label: "Off Duty",
  };
}

export default function SocietyDashboard() {
  const { themeColors } = useTheme();

  // 🔁 Now using static dummy data
  const [members, setMembers] = useState(DUMMY_MEMBERS);
  const [workers, setWorkers] = useState(DUMMY_WORKERS);

  const [activeTab, setActiveTab] = useState("members"); // "members" | "workers"

  // filters
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("ALL");

  const [workerSearch, setWorkerSearch] = useState("");
  const [workerStatusFilter, setWorkerStatusFilter] = useState("ALL");

  // status update tracking (just for UI demo)
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [updatingWorkerId, setUpdatingWorkerId] = useState(null);

  // ======== SUMMARY STATS =========
  const summary = useMemo(() => {
    const totalMembers = members.length;
    const activeMembers = members.filter(
      (m) => String(m.status || "").toUpperCase() === "ACTIVE"
    ).length;
    const blockedMembers = members.filter(
      (m) => String(m.status || "").toUpperCase() === "BLOCKED"
    ).length;

    const totalWorkers = workers.length;
    const onDutyWorkers = workers.filter(
      (w) => String(w.status || "").toUpperCase() === "ON_DUTY"
    ).length;
    const offDutyWorkers = workers.filter(
      (w) => String(w.status || "").toUpperCase() === "OFF_DUTY"
    ).length;

    return {
      totalMembers,
      activeMembers,
      blockedMembers,
      totalWorkers,
      onDutyWorkers,
      offDutyWorkers,
    };
  }, [members, workers]);

  // ======== FILTERED LISTS =========

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();

    return (members || []).filter((m) => {
      const statusOk =
        memberStatusFilter === "ALL"
          ? true
          : String(m.status || "").toUpperCase() === memberStatusFilter;

      const searchOk =
        !q ||
        [m.name, m.flatNumber, m.phone, m.email]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q));

      return statusOk && searchOk;
    });
  }, [members, memberSearch, memberStatusFilter]);

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase();

    return (workers || []).filter((w) => {
      const statusOk =
        workerStatusFilter === "ALL"
          ? true
          : String(w.status || "").toUpperCase() === workerStatusFilter;

      const searchOk =
        !q ||
        [w.name, w.phone, w.role, w.employeeCode]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q));

      return statusOk && searchOk;
    });
  }, [workers, workerSearch, workerStatusFilter]);

  // ======== STATUS UPDATE HANDLERS (LOCAL ONLY, NO API) =========

  const handleMemberStatusChange = (memberId, status) => {
    setUpdatingMemberId(memberId);

    setMembers((prev) =>
      (prev || []).map((m) =>
        m.id === memberId
          ? {
              ...m,
              status,
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );

    toast.success("Member status updated (demo)");
    setTimeout(() => setUpdatingMemberId(null), 400);
  };

  const handleWorkerStatusChange = (workerId, status) => {
    setUpdatingWorkerId(workerId);

    setWorkers((prev) =>
      (prev || []).map((w) =>
        w.id === workerId
          ? {
              ...w,
              status,
              updatedAt: new Date().toISOString(),
            }
          : w
      )
    );

    toast.success("Worker status updated (demo)");
    setTimeout(() => setUpdatingWorkerId(null), 400);
  };

  // ======== MAIN RENDER =========

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaBuilding />
            Society Admin Dashboard
            <span className="text-xs font-normal opacity-70 ml-1">
              (Demo Data)
            </span>
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Society members aur workers ko ek hi jagah se manage karo — abhi sab
            data demo / static hai.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          className="rounded-2xl border p-4 flex items-center gap-3 shadow-sm"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#00000010" }}>
            <FaUserFriends className="text-lg" />
          </div>
          <div>
            <p
              className="text-xs uppercase font-semibold opacity-70"
              style={{ color: themeColors.text }}
            >
              Total Members
            </p>
            <p
              className="text-2xl font-bold leading-tight"
              style={{ color: themeColors.text }}
            >
              {summary.totalMembers}
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-4 flex items-center gap-3 shadow-sm"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#00ff0020" }}>
            <FaUsersCog className="text-lg" />
          </div>
          <div>
            <p
              className="text-xs uppercase font-semibold opacity-70"
              style={{ color: themeColors.text }}
            >
              Active Members
            </p>
            <p
              className="text-2xl font-bold leading-tight"
              style={{ color: themeColors.text }}
            >
              {summary.activeMembers}
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-4 flex items-center gap-3 shadow-sm"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#ff000020" }}>
            <FaUserSlash className="text-lg" />
          </div>
          <div>
            <p
              className="text-xs uppercase font-semibold opacity-70"
              style={{ color: themeColors.text }}
            >
              Blocked Members
            </p>
            <p
              className="text-2xl font-bold leading-tight"
              style={{ color: themeColors.text }}
            >
              {summary.blockedMembers}
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-4 flex items-center gap-3 shadow-sm"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#0000ff20" }}>
            <FaUserShield className="text-lg" />
          </div>
          <div>
            <p
              className="text-xs uppercase font-semibold opacity-70"
              style={{ color: themeColors.text }}
            >
              Total Workers
            </p>
            <p
              className="text-2xl font-bold leading-tight"
              style={{ color: themeColors.text }}
            >
              {summary.totalWorkers}
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-4 flex items-center gap-3 shadow-sm"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#00ff0020" }}>
            <FaUserTie className="text-lg" />
          </div>
          <div>
            <p
              className="text-xs uppercase font-semibold opacity-70"
              style={{ color: themeColors.text }}
            >
              On Duty Workers
            </p>
            <p
              className="text-2xl font-bold leading-tight"
              style={{ color: themeColors.text }}
            >
              {summary.onDutyWorkers}
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-4 flex items-center gap-3 shadow-sm"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#aaaaaa20" }}>
            <FaRegClock className="text-lg" />
          </div>
          <div>
            <p
              className="text-xs uppercase font-semibold opacity-70"
              style={{ color: themeColors.text }}
            >
              Off Duty Workers
            </p>
            <p
              className="text-2xl font-bold leading-tight"
              style={{ color: themeColors.text }}
            >
              {summary.offDutyWorkers}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="rounded-2xl border shadow-sm"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        {/* Tab headers */}
        <div className="flex border-b" style={{ borderColor: themeColors.border }}>
          {[
            { id: "members", label: "Members", icon: <FaUserFriends /> },
            { id: "workers", label: "Workers", icon: <FaUserShield /> },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  color: active ? themeColors.primary : themeColors.text,
                  borderBottom: active
                    ? `2px solid ${themeColors.primary}`
                    : "2px solid transparent",
                  backgroundColor: active
                    ? themeColors.background
                    : themeColors.surface,
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-4 md:p-5">
          {activeTab === "members" && (
            <>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-xs" />
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name, flat no, phone, email"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                  />
                </div>
                <div className="min-w-[160px]">
                  <label
                    className="text-xs mb-1 block opacity-70"
                    style={{ color: themeColors.text }}
                  >
                    Status
                  </label>
                  <select
                    className="w-full p-2 rounded-lg border text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    {MEMBER_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
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
                        "Flat No.",
                        "Member Name",
                        "Contact",
                        "Status",
                        "Family / Vehicles",
                        "Joined On",
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
                    {filteredMembers.map((m) => {
                      const chip = getStatusChip(m.status, themeColors, "member");
                      return (
                        <tr key={m.id}>
                          <td
                            className="px-4 py-2 font-mono"
                            style={{ color: themeColors.text }}
                          >
                            {m.flatNumber || "-"}
                          </td>
                          <td className="px-4 py-2">
                            <div
                              className="font-medium flex items-center gap-1"
                              style={{ color: themeColors.text }}
                            >
                              <FaUser className="text-xs opacity-60" />
                              {m.name || "-"}
                            </div>
                            <p
                              className="text-[11px] opacity-70 mt-0.5"
                              style={{ color: themeColors.text }}
                            >
                              {m.email || "-"}
                            </p>
                          </td>
                          <td className="px-4 py-2">
                            <div
                              className="flex items-center gap-1 text-xs"
                              style={{ color: themeColors.text }}
                            >
                              <FaPhoneAlt className="text-[10px]" />
                              {m.phone || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={{
                                backgroundColor: chip.bg,
                                color: chip.color,
                              }}
                            >
                              {chip.icon}
                              {chip.label}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs">
                            <div
                              className="opacity-80"
                              style={{ color: themeColors.text }}
                            >
                              Family:{" "}
                              <span className="font-semibold">
                                {m.familyCount ?? "-"}
                              </span>
                            </div>
                            <div
                              className="opacity-80"
                              style={{ color: themeColors.text }}
                            >
                              Vehicles:{" "}
                              <span className="font-semibold">
                                {m.vehicleCount ?? "-"}
                              </span>
                            </div>
                          </td>
                          <td
                            className="px-4 py-2 text-xs"
                            style={{ color: themeColors.text }}
                          >
                            {fmtDateTime(m.createdAt)}
                          </td>
                          <td className="px-4 py-2 text-right text-xs">
                            <div className="flex flex-col gap-1 items-end">
                              <select
                                className="px-2 py-1 rounded-lg border text-[11px]"
                                style={{
                                  borderColor: themeColors.border,
                                  backgroundColor: themeColors.surface,
                                  color: themeColors.text,
                                }}
                                value={
                                  String(m.status || "").toUpperCase() ||
                                  "INACTIVE"
                                }
                                disabled={updatingMemberId === m.id}
                                onChange={(e) =>
                                  handleMemberStatusChange(m.id, e.target.value)
                                }
                              >
                                {MEMBER_STATUS_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                              {updatingMemberId === m.id && (
                                <span
                                  className="text-[11px] opacity-70"
                                  style={{ color: themeColors.text }}
                                >
                                  Updating...
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredMembers.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-sm"
                          style={{ color: themeColors.text }}
                        >
                          No members found for current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "workers" && (
            <>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-xs" />
                  <input
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    placeholder="Search by name, role, phone, code"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                  />
                </div>
                <div className="min-w-[160px]">
                  <label
                    className="text-xs mb-1 block opacity-70"
                    style={{ color: themeColors.text }}
                  >
                    Status
                  </label>
                  <select
                    className="w-full p-2 rounded-lg border text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    value={workerStatusFilter}
                    onChange={(e) => setWorkerStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    {WORKER_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
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
                        "Role / Code",
                        "Contact",
                        "Shift",
                        "Status",
                        "Last Check-in",
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
                    {filteredWorkers.map((w) => {
                      const chip = getStatusChip(w.status, themeColors, "worker");
                      return (
                        <tr key={w.id}>
                          <td className="px-4 py-2">
                            <div
                              className="font-medium flex items-center gap-1"
                              style={{ color: themeColors.text }}
                            >
                              <FaUserTie className="text-xs opacity-60" />
                              {w.name || "-"}
                            </div>
                            <p
                              className="text-[11px] opacity-70 mt-0.5"
                              style={{ color: themeColors.text }}
                            >
                              {w.type || "-"}
                            </p>
                          </td>
                          <td className="px-4 py-2 text-xs">
                            <div
                              className="opacity-80"
                              style={{ color: themeColors.text }}
                            >
                              {w.role || "-"}
                            </div>
                            <div
                              className="opacity-60 text-[11px]"
                              style={{ color: themeColors.text }}
                            >
                              Code: {w.employeeCode || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div
                              className="flex items-center gap-1 text-xs"
                              style={{ color: themeColors.text }}
                            >
                              <FaPhoneAlt className="text-[10px]" />
                              {w.phone || "-"}
                            </div>
                          </td>
                          <td
                            className="px-4 py-2 text-xs"
                            style={{ color: themeColors.text }}
                          >
                            {w.shift || "-"}
                          </td>
                          <td className="px-4 py-2 text-xs">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={{
                                backgroundColor: chip.bg,
                                color: chip.color,
                              }}
                            >
                              {chip.icon}
                              {chip.label}
                            </span>
                          </td>
                          <td
                            className="px-4 py-2 text-xs"
                            style={{ color: themeColors.text }}
                          >
                            {fmtDateTime(w.lastCheckInAt)}
                          </td>
                          <td className="px-4 py-2 text-right text-xs">
                            <div className="flex flex-col gap-1 items-end">
                              <select
                                className="px-2 py-1 rounded-lg border text-[11px]"
                                style={{
                                  borderColor: themeColors.border,
                                  backgroundColor: themeColors.surface,
                                  color: themeColors.text,
                                }}
                                value={
                                  String(w.status || "").toUpperCase() ||
                                  "OFF_DUTY"
                                }
                                disabled={updatingWorkerId === w.id}
                                onChange={(e) =>
                                  handleWorkerStatusChange(w.id, e.target.value)
                                }
                              >
                                {WORKER_STATUS_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                              {updatingWorkerId === w.id && (
                                <span
                                  className="text-[11px] opacity-70"
                                  style={{ color: themeColors.text }}
                                >
                                  Updating...
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredWorkers.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-sm"
                          style={{ color: themeColors.text }}
                        >
                          No workers found for current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

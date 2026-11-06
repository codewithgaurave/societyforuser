// src/pages/SocietyDashboard.jsx
import { useMemo, useState, useEffect } from "react";
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
  FaFilter,
  FaTimes,
  FaDownload,
  FaClock,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { listUsers, updateUserBlockStatus } from "../apis/users";
import { toggleUserAvailabilityApi } from "../apis/availability";

// Removed dummy data arrays

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

const fmtDate = (d) => {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return "-";
  }
};

const getRenewalStyle = (plan, expiryDate, defaultColor) => {
  if (!plan || plan === "free" || !expiryDate) return { color: defaultColor };
  const diffTime = new Date(expiryDate) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { color: "#dc2626", fontWeight: "bold" };
  if (diffDays <= 7) return { color: "#ea580c", fontWeight: "bold" };
  return { color: defaultColor };
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

  // Live Data
  const [members, setMembers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await listUsers();
      const allUsers = Array.isArray(res) ? res : res?.users || [];
      
      const parsedMembers = allUsers
        .filter((u) => u.role === "society member")
        .map((u) => ({
          id: u._id,
          flatNumber: u.address || "-", // Address is used as flat number for now
          address: u.address || "-",
          pincode: u.pincode || "-",
          name: u.fullName,
          phone: u.mobileNumber,
          email: u.email,
          status: u.isBlocked ? "BLOCKED" : "ACTIVE",
          familyCount: "-", 
          vehicleCount: "-",
          createdAt: u.createdAt,
          activePlan: u.activePlan,
          planExpiryDate: u.planExpiryDate,
        }));
        
      const parsedWorkers = allUsers
        .filter((u) => u.role === "society service")
        .map((u) => ({
          id: u._id,
          name: u.fullName,
          type: u.serviceCategory?.name || "Service",
          role: u.role,
          employeeCode: u.registrationID,
          phone: u.mobileNumber,
          shift: "-",
          status: u.isBlocked ? "BLOCKED" : (u.isAvailable ? "ON_DUTY" : "OFF_DUTY"), // Or whatever logic you prefer
          lastCheckInAt: u.updatedAt,
          address: u.address || "-",
          pincode: u.pincode || "-",
        }));

      setMembers(parsedMembers);
      setWorkers(parsedWorkers);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };


  const [activeTab, setActiveTab] = useState("members"); // "members" | "workers"

  // pagination
  const ITEMS_PER_PAGE = 10;
  const [memberPage, setMemberPage] = useState(1);
  const [workerPage, setWorkerPage] = useState(1);

  // filters - Members
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("ALL");
  const [memberPlanFilter, setMemberPlanFilter] = useState("ALL");
  const [memberSort, setMemberSort] = useState("NEWEST");

  // filters - Workers
  const [workerSearch, setWorkerSearch] = useState("");
  const [workerStatusFilter, setWorkerStatusFilter] = useState("ALL");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("ALL");

  // status update tracking (just for UI demo)
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [updatingWorkerId, setUpdatingWorkerId] = useState(null);

  // Service types for workers
  const workerServiceTypes = useMemo(() => {
    return Array.from(new Set(workers.map((w) => w.type).filter(Boolean)));
  }, [workers]);

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

    const now = new Date();
    
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of this week (assuming Monday is the first day of the week)
    const currentDay = startOfToday.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfToday.getDate() - distanceToMonday);

    // Start of last week
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    // Start of this month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Start of last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const membersThisWeek = members.filter(m => new Date(m.createdAt) >= startOfThisWeek).length;
    const membersLastWeek = members.filter(m => {
      const d = new Date(m.createdAt);
      return d >= startOfLastWeek && d < startOfThisWeek;
    }).length;

    const workersThisWeek = workers.filter(w => new Date(w.createdAt) >= startOfThisWeek).length;
    const workersLastWeek = workers.filter(w => {
      const d = new Date(w.createdAt);
      return d >= startOfLastWeek && d < startOfThisWeek;
    }).length;

    return {
      totalMembers,
      activeMembers,
      blockedMembers,
      totalWorkers,
      onDutyWorkers,
      offDutyWorkers,
      membersThisWeek,
      membersLastWeek,
      workersThisWeek,
      workersLastWeek
    };
  }, [members, workers]);

  // Quick Chips Counts
  const memberChips = useMemo(() => {
    const now = new Date();
    let expiringSoon = 0;
    members.forEach((m) => {
      if (m.planExpiryDate && m.activePlan && String(m.activePlan).toLowerCase() !== "free") {
        const diffDays = Math.ceil((new Date(m.planExpiryDate) - now) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) expiringSoon++;
      }
    });
    return {
      total: members.length,
      active: summary.activeMembers,
      blocked: summary.blockedMembers,
      expiringSoon,
    };
  }, [members, summary]);

  const workerChips = useMemo(() => {
    return {
      total: workers.length,
      onDuty: summary.onDutyWorkers,
      offDuty: summary.offDutyWorkers,
      blocked: workers.filter((w) => String(w.status || "").toUpperCase() === "BLOCKED").length,
    };
  }, [workers, summary]);

  // Member Filter Reset & Active Check
  const hasMemberFilters = 
    Boolean(memberSearch.trim()) ||
    memberStatusFilter !== "ALL" ||
    memberPlanFilter !== "ALL" ||
    memberSort !== "NEWEST";

  const resetMemberFilters = () => {
    setMemberSearch("");
    setMemberStatusFilter("ALL");
    setMemberPlanFilter("ALL");
    setMemberSort("NEWEST");
  };

  // Worker Filter Reset & Active Check
  const hasWorkerFilters =
    Boolean(workerSearch.trim()) ||
    workerStatusFilter !== "ALL" ||
    workerTypeFilter !== "ALL";

  const resetWorkerFilters = () => {
    setWorkerSearch("");
    setWorkerStatusFilter("ALL");
    setWorkerTypeFilter("ALL");
  };

  // Export handlers
  const handleExportMembersCsv = () => {
    if (!filteredMembers.length) {
      toast.error("No members to export");
      return;
    }
    const headers = ["Address", "Member Name", "Phone", "Email", "Status", "Active Plan", "Renewal Date", "Joined Date"];
    const rows = filteredMembers.map((m) => [
      `"${(m.address || "").replace(/"/g, '""')}"`,
      `"${(m.name || "").replace(/"/g, '""')}"`,
      `"${(m.phone || "").toString().replace(/"/g, '""')}"`,
      `"${(m.email || "").replace(/"/g, '""')}"`,
      `"${m.status || ""}"`,
      `"${m.activePlan || "free"}"`,
      `"${m.planExpiryDate ? fmtDate(m.planExpiryDate) : "-"}"`,
      `"${m.createdAt ? fmtDateTime(m.createdAt) : "-"}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Members CSV exported successfully!");
  };

  const handleExportWorkersCsv = () => {
    if (!filteredWorkers.length) {
      toast.error("No workers to export");
      return;
    }
    const headers = ["Name", "Service Type", "Role", "Employee Code", "Phone", "Status", "Address"];
    const rows = filteredWorkers.map((w) => [
      `"${(w.name || "").replace(/"/g, '""')}"`,
      `"${(w.type || "").replace(/"/g, '""')}"`,
      `"${(w.role || "").replace(/"/g, '""')}"`,
      `"${(w.employeeCode || "").replace(/"/g, '""')}"`,
      `"${(w.phone || "").toString().replace(/"/g, '""')}"`,
      `"${w.status || ""}"`,
      `"${(w.address || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workers_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Workers CSV exported successfully!");
  };

  // ======== FILTERED LISTS =========

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();

    let list = (members || []).filter((m) => {
      const statusOk =
        memberStatusFilter === "ALL"
          ? true
          : String(m.status || "").toUpperCase() === memberStatusFilter;

      const searchOk =
        !q ||
        [m.name, m.flatNumber, m.phone, m.email, m.address]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q));

      // Plan filter
      let planOk = true;
      if (memberPlanFilter !== "ALL") {
        const plan = (m.activePlan || "free").toLowerCase();
        const isFree = !m.activePlan || plan === "free";
        const now = new Date();
        if (memberPlanFilter === "FREE") planOk = isFree;
        else if (memberPlanFilter === "PAID") planOk = !isFree;
        else if (memberPlanFilter === "EXPIRING_SOON") {
          if (isFree || !m.planExpiryDate) planOk = false;
          else {
            const diffDays = Math.ceil((new Date(m.planExpiryDate) - now) / (1000 * 60 * 60 * 24));
            planOk = diffDays >= 0 && diffDays <= 7;
          }
        } else if (memberPlanFilter === "EXPIRED") {
          if (isFree || !m.planExpiryDate) planOk = false;
          else {
            const diffDays = Math.ceil((new Date(m.planExpiryDate) - now) / (1000 * 60 * 60 * 24));
            planOk = diffDays < 0;
          }
        }
      }

      return statusOk && searchOk && planOk;
    });

    // Member Sort
    list = [...list].sort((a, b) => {
      if (memberSort === "NEWEST") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (memberSort === "OLDEST") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (memberSort === "NAME_ASC") return (a.name || "").localeCompare(b.name || "");
      if (memberSort === "EXPIRY_SOON") {
        const timeA = a.planExpiryDate ? new Date(a.planExpiryDate).getTime() : Infinity;
        const timeB = b.planExpiryDate ? new Date(b.planExpiryDate).getTime() : Infinity;
        return timeA - timeB;
      }
      return 0;
    });

    return list;
  }, [members, memberSearch, memberStatusFilter, memberPlanFilter, memberSort]);

  useEffect(() => {
    setMemberPage(1);
  }, [memberSearch, memberStatusFilter, memberPlanFilter, memberSort]);

  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, memberPage]);
  const memberTotalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase();

    return (workers || []).filter((w) => {
      const statusOk =
        workerStatusFilter === "ALL"
          ? true
          : String(w.status || "").toUpperCase() === workerStatusFilter;

      const typeOk =
        workerTypeFilter === "ALL"
          ? true
          : (w.type || "") === workerTypeFilter;

      const searchOk =
        !q ||
        [w.name, w.phone, w.role, w.employeeCode, w.type, w.address]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q));

      return statusOk && typeOk && searchOk;
    });
  }, [workers, workerSearch, workerStatusFilter, workerTypeFilter]);

  useEffect(() => {
    setWorkerPage(1);
  }, [workerSearch, workerStatusFilter, workerTypeFilter]);

  const paginatedWorkers = useMemo(() => {
    const start = (workerPage - 1) * ITEMS_PER_PAGE;
    return filteredWorkers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWorkers, workerPage]);
  const workerTotalPages = Math.ceil(filteredWorkers.length / ITEMS_PER_PAGE);

  // ======== STATUS UPDATE HANDLERS (LOCAL ONLY, NO API) =========

  const handleMemberStatusChange = async (memberId, status) => {
    setUpdatingMemberId(memberId);
    try {
      const isBlocked = status === "BLOCKED";
      await updateUserBlockStatus(memberId, isBlocked);


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

    toast.success("Member status updated");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleWorkerStatusChange = async (workerId, status) => {
    setUpdatingWorkerId(workerId);
    try {
      const isBlocked = status === "BLOCKED";
      await updateUserBlockStatus(workerId, isBlocked);

      if (!isBlocked) {
        const isAvailable = status === "ON_DUTY";
        await toggleUserAvailabilityApi(workerId, isAvailable);
      }

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

    toast.success("Worker status updated");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingWorkerId(null);
    }
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
              (Live Data)
            </span>
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Society members aur workers ko ek hi jagah se manage karo.
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
            <div className="flex flex-col mt-1">
              <span className="text-[10px] font-medium text-green-600">
                +{summary.membersThisWeek} added this week
              </span>
              <span className="text-[10px] opacity-60">
                {summary.membersLastWeek} added last week
              </span>
            </div>
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
            <div className="flex flex-col mt-1">
              <span className="text-[10px] font-medium text-green-600">
                +{summary.workersThisWeek} added this week
              </span>
              <span className="text-[10px] opacity-60">
                {summary.workersLastWeek} added last week
              </span>
            </div>
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
              {/* Members Quick Chips & Actions */}
              <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: themeColors.border }}>
                <span className="text-xs font-semibold opacity-60 flex items-center gap-1.5 mr-1" style={{ color: themeColors.text }}>
                  <FaFilter className="text-[10px]" /> Quick:
                </span>

                <button
                  type="button"
                  onClick={resetMemberFilters}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    !hasMemberFilters ? "ring-2 ring-blue-500 shadow-sm" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: !hasMemberFilters ? themeColors.primary : themeColors.background,
                    color: !hasMemberFilters ? "#fff" : themeColors.text,
                    border: `1px solid ${themeColors.border}`,
                  }}
                >
                  All ({memberChips.total})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetMemberFilters();
                    setMemberStatusFilter("ACTIVE");
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    memberStatusFilter === "ACTIVE" ? "ring-2 ring-emerald-500 shadow-sm font-semibold" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: memberStatusFilter === "ACTIVE" ? "#10b981" : "#10b98115",
                    color: memberStatusFilter === "ACTIVE" ? "#fff" : "#059669",
                    border: `1px solid ${memberStatusFilter === "ACTIVE" ? "#10b981" : "#10b98130"}`,
                  }}
                >
                  <FaCheckCircle className="text-[10px]" /> Active ({memberChips.active})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetMemberFilters();
                    setMemberStatusFilter("BLOCKED");
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    memberStatusFilter === "BLOCKED" ? "ring-2 ring-red-500 shadow-sm font-semibold" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: memberStatusFilter === "BLOCKED" ? "#ef4444" : "#ef444415",
                    color: memberStatusFilter === "BLOCKED" ? "#fff" : "#dc2626",
                    border: `1px solid ${memberStatusFilter === "BLOCKED" ? "#ef4444" : "#ef444430"}`,
                  }}
                >
                  <FaBan className="text-[10px]" /> Blocked ({memberChips.blocked})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetMemberFilters();
                    setMemberPlanFilter("EXPIRING_SOON");
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    memberPlanFilter === "EXPIRING_SOON" ? "ring-2 ring-amber-500 shadow-sm font-semibold" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: memberPlanFilter === "EXPIRING_SOON" ? "#f59e0b" : "#f59e0b15",
                    color: memberPlanFilter === "EXPIRING_SOON" ? "#fff" : "#d97706",
                    border: `1px solid ${memberPlanFilter === "EXPIRING_SOON" ? "#f59e0b" : "#f59e0b30"}`,
                  }}
                >
                  <FaClock className="text-[10px]" /> Expiring Soon ({memberChips.expiringSoon})
                </button>

                {/* Right actions */}
                <div className="ml-auto flex items-center gap-2">
                  {hasMemberFilters && (
                    <button
                      type="button"
                      onClick={resetMemberFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      style={{ borderColor: "#fecaca" }}
                      title="Reset filters"
                    >
                      <FaTimes className="text-[10px]" /> Clear
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleExportMembersCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                    title="Export Members to Excel/CSV"
                  >
                    <FaDownload className="text-xs" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                <div className="md:col-span-6 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-xs" />
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name, flat no, phone, email, address..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <select
                    className="w-full p-2 rounded-lg border text-xs md:text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Status</option>
                    {MEMBER_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <select
                    className="w-full p-2 rounded-lg border text-xs md:text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    value={memberPlanFilter}
                    onChange={(e) => setMemberPlanFilter(e.target.value)}
                  >
                    <option value="ALL">All Plans</option>
                    <option value="FREE">Free Plan</option>
                    <option value="PAID">Paid Plan (Active)</option>
                    <option value="EXPIRING_SOON">⏳ Expiring (≤ 7d)</option>
                    <option value="EXPIRED">⚠️ Expired</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <select
                    className="w-full p-2 rounded-lg border text-xs md:text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    value={memberSort}
                    onChange={(e) => setMemberSort(e.target.value)}
                  >
                    <option value="NEWEST">Latest Joined</option>
                    <option value="OLDEST">Oldest First</option>
                    <option value="NAME_ASC">Name (A-Z)</option>
                    <option value="EXPIRY_SOON">Renewal Soonest</option>
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
                        "Address",
                        "Member Name",
                        "Contact",
                        "Status",
                        "Family / Vehicles",
                        "Renewal Date",
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
                    {paginatedMembers.map((m) => {
                      const chip = getStatusChip(m.status, themeColors, "member");
                      return (
                        <tr key={m.id}>
                          <td
                            className="px-4 py-2 text-xs"
                            style={{ color: themeColors.text }}
                          >
                            <div className="font-medium">{m.address}</div>
                            <div className="text-[10px] opacity-70 mt-0.5">Pincode: {m.pincode}</div>
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
                            style={getRenewalStyle(m.activePlan, m.planExpiryDate, themeColors.text)}
                          >
                            {m.planExpiryDate ? fmtDate(m.planExpiryDate) : "-"}
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

                    {paginatedMembers.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
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

              {/* Members Pagination UI */}
              {memberTotalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                  <span className="text-sm opacity-70" style={{ color: themeColors.text }}>
                    Showing {(memberPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(memberPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={memberPage === 1}
                      onClick={() => setMemberPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                      style={{ borderColor: themeColors.border, color: themeColors.text }}
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 text-sm" style={{ color: themeColors.text }}>
                      {memberPage} / {memberTotalPages}
                    </span>
                    <button
                      disabled={memberPage === memberTotalPages}
                      onClick={() => setMemberPage(p => Math.min(memberTotalPages, p + 1))}
                      className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                      style={{ borderColor: themeColors.border, color: themeColors.text }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "workers" && (
            <>
              {/* Workers Quick Chips & Actions */}
              <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: themeColors.border }}>
                <span className="text-xs font-semibold opacity-60 flex items-center gap-1.5 mr-1" style={{ color: themeColors.text }}>
                  <FaFilter className="text-[10px]" /> Quick:
                </span>

                <button
                  type="button"
                  onClick={resetWorkerFilters}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    !hasWorkerFilters ? "ring-2 ring-blue-500 shadow-sm" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: !hasWorkerFilters ? themeColors.primary : themeColors.background,
                    color: !hasWorkerFilters ? "#fff" : themeColors.text,
                    border: `1px solid ${themeColors.border}`,
                  }}
                >
                  All ({workerChips.total})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetWorkerFilters();
                    setWorkerStatusFilter("ON_DUTY");
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    workerStatusFilter === "ON_DUTY" ? "ring-2 ring-emerald-500 shadow-sm font-semibold" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: workerStatusFilter === "ON_DUTY" ? "#10b981" : "#10b98115",
                    color: workerStatusFilter === "ON_DUTY" ? "#fff" : "#059669",
                    border: `1px solid ${workerStatusFilter === "ON_DUTY" ? "#10b981" : "#10b98130"}`,
                  }}
                >
                  <FaCheckCircle className="text-[10px]" /> On Duty ({workerChips.onDuty})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetWorkerFilters();
                    setWorkerStatusFilter("OFF_DUTY");
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    workerStatusFilter === "OFF_DUTY" ? "ring-2 ring-gray-500 shadow-sm font-semibold" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: workerStatusFilter === "OFF_DUTY" ? "#64748b" : "#64748b15",
                    color: workerStatusFilter === "OFF_DUTY" ? "#fff" : "#475569",
                    border: `1px solid ${workerStatusFilter === "OFF_DUTY" ? "#64748b" : "#64748b30"}`,
                  }}
                >
                  <FaRegClock className="text-[10px]" /> Off Duty ({workerChips.offDuty})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetWorkerFilters();
                    setWorkerStatusFilter("BLOCKED");
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    workerStatusFilter === "BLOCKED" ? "ring-2 ring-red-500 shadow-sm font-semibold" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: workerStatusFilter === "BLOCKED" ? "#ef4444" : "#ef444415",
                    color: workerStatusFilter === "BLOCKED" ? "#fff" : "#dc2626",
                    border: `1px solid ${workerStatusFilter === "BLOCKED" ? "#ef4444" : "#ef444430"}`,
                  }}
                >
                  <FaBan className="text-[10px]" /> Blocked ({workerChips.blocked})
                </button>

                {/* Right actions */}
                <div className="ml-auto flex items-center gap-2">
                  {hasWorkerFilters && (
                    <button
                      type="button"
                      onClick={resetWorkerFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      style={{ borderColor: "#fecaca" }}
                      title="Reset filters"
                    >
                      <FaTimes className="text-[10px]" /> Clear
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleExportWorkersCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                    title="Export Workers to Excel/CSV"
                  >
                    <FaDownload className="text-xs" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                <div className="md:col-span-6 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-xs" />
                  <input
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    placeholder="Search by name, role, phone, code, address..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                  />
                </div>
                <div className="md:col-span-3">
                  <select
                    className="w-full p-2 rounded-lg border text-xs md:text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    value={workerStatusFilter}
                    onChange={(e) => setWorkerStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Status</option>
                    {WORKER_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <select
                    className="w-full p-2 rounded-lg border text-xs md:text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                    value={workerTypeFilter}
                    onChange={(e) => setWorkerTypeFilter(e.target.value)}
                  >
                    <option value="ALL">All Service Types</option>
                    {workerServiceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
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
                        "Address",
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
                    {paginatedWorkers.map((w) => {
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
                            <div className="font-medium max-w-[200px] truncate" title={w.address}>{w.address}</div>
                            <div className="text-[10px] opacity-70 mt-0.5">Pincode: {w.pincode}</div>
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

                    {paginatedWorkers.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
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

              {/* Workers Pagination UI */}
              {workerTotalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                  <span className="text-sm opacity-70" style={{ color: themeColors.text }}>
                    Showing {(workerPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(workerPage * ITEMS_PER_PAGE, filteredWorkers.length)} of {filteredWorkers.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={workerPage === 1}
                      onClick={() => setWorkerPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                      style={{ borderColor: themeColors.border, color: themeColors.text }}
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 text-sm" style={{ color: themeColors.text }}>
                      {workerPage} / {workerTotalPages}
                    </span>
                    <button
                      disabled={workerPage === workerTotalPages}
                      onClick={() => setWorkerPage(p => Math.min(workerTotalPages, p + 1))}
                      className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                      style={{ borderColor: themeColors.border, color: themeColors.text }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FaCommentAlt,
  FaSearch,
  FaSyncAlt,
  FaCheck,
  FaTimes,
  FaTrash,
  FaEye,
  FaMapMarkerAlt,
  FaUser,
  FaHeart,
  FaRegComment,
  FaChevronLeft,
  FaChevronRight,
  FaClock
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  listAdminPosts,
  togglePostActiveApi,
  deletePostApi,
  listAdminCategories,
  getCommunitySettingsApi,
  updateCommunitySettingsApi
} from "../apis/community";
import { listColonies } from "../apis/colonies";

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

export default function CommunityPostPage() {
  const { themeColors } = useTheme();

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colonies, setColonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Auto delete duration setting (hours)
  const [autoDeleteHours, setAutoDeleteHours] = useState(48);
  const [settingInput, setSettingInput] = useState(48);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [colonyFilter, setColonyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive" | "expired" | "unexpired"

  // Pagination from backend
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  // View details modal
  const [viewPost, setViewPost] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch categories, colonies & auto-delete settings in parallel
      const [catsRes, colsRes, settingsRes] = await Promise.all([
        listAdminCategories(),
        listColonies(),
        getCommunitySettingsApi().catch(() => ({ communityAutoDeleteHours: 48 }))
      ]);
      setCategories(catsRes || []);
      setColonies(colsRes || []);
      
      const hrs = typeof settingsRes?.communityAutoDeleteHours === "number" 
        ? settingsRes.communityAutoDeleteHours 
        : 48;
      setAutoDeleteHours(hrs);
      setSettingInput(hrs);

      // Fetch posts for page
      await fetchPosts(1);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load community resources.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (page = 1) => {
    try {
      setError("");
      const params = {
        page,
        limit: 10
      };

      if (search.trim()) params.search = search.trim();
      if (colonyFilter !== "all") params.colonyId = colonyFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      
      if (statusFilter === "active") params.isActive = true;
      else if (statusFilter === "inactive") params.isActive = false;
      else if (statusFilter === "expired") params.status = "expired";
      else if (statusFilter === "unexpired") params.status = "unexpired";

      const res = await listAdminPosts(params);
      setPosts(res?.posts || []);
      setTotalPages(res?.pages || 1);
      setCurrentPage(res?.page || 1);
      setTotalPosts(res?.total || 0);

      if (typeof res?.communityAutoDeleteHours === "number") {
        setAutoDeleteHours(res.communityAutoDeleteHours);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch posts");
    }
  };

  const handleSaveSettings = async (hoursToSave) => {
    const val = hoursToSave !== undefined ? hoursToSave : Number(settingInput);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative number of hours");
      return;
    }

    try {
      setSavingSettings(true);
      const res = await updateCommunitySettingsApi({ communityAutoDeleteHours: val });
      const updatedHrs = res?.communityAutoDeleteHours ?? val;
      setAutoDeleteHours(updatedHrs);
      setSettingInput(updatedHrs);
      toast.success(res?.message || `Auto-delete duration set to ${updatedHrs} hours`);
      fetchPosts(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update auto-delete settings");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchPosts(1);
  }, [colonyFilter, categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts(1);
  };

  const handleToggleStatus = async (post) => {
    const postId = post._id || post.id;
    try {
      const res = await togglePostActiveApi(postId);
      toast.success(res?.message || "Post status updated successfully");
      
      // Update in local state
      setPosts((prev) =>
        prev.map((p) => ((p._id || p.id) === postId ? { ...p, isActive: !p.isActive } : p))
      );

      if (viewPost && (viewPost._id || viewPost.id) === postId) {
        setViewPost((prev) => ({ ...prev, isActive: !prev.isActive }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to toggle post status");
    }
  };

  const handleDeletePost = async (post) => {
    const ok = window.confirm("Are you sure you want to delete this community post? This cannot be undone.");
    if (!ok) return;

    const postId = post._id || post.id;
    try {
      const res = await deletePostApi(postId);
      toast.success(res?.message || "Post deleted permanently");
      setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
      
      if (viewPost && (viewPost._id || viewPost.id) === postId) {
        setViewPost(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete post");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchPosts(newPage);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4" style={{ color: themeColors.text }}>
            Loading community posts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaCommentAlt />
            Community Posts
          </h1>
          <p className="text-sm mt-1 opacity-75" style={{ color: themeColors.text }}>
            Review, moderate, and manage society-specific posts, suggestions, events, and complaints.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border hover:opacity-80 transition"
          style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface, color: themeColors.text }}
        >
          <FaSyncAlt className="text-xs" />
          Refresh
        </button>
      </div>

      {/* Auto-Delete Settings Card (Admin Controls) */}
      <div 
        className="rounded-2xl border shadow-sm p-4 md:p-5 space-y-3"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 text-lg">
              <FaClock />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                Auto-Delete Posts Duration
                <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-amber-500/15 text-amber-600 border border-amber-500/20">
                  Currently: {autoDeleteHours === 0 ? "Off (Never)" : `${autoDeleteHours} Hours (${(autoDeleteHours / 24).toFixed(1)} Days)`}
                </span>
              </h2>
              <p className="text-xs opacity-75 mt-0.5" style={{ color: themeColors.text }}>
                Set duration after which posts automatically expire and hide from users in the mobile app. (Default: 48 hrs)
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets & Control Input */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium opacity-70" style={{ color: themeColors.text }}>Presets:</span>
            {[
              { label: "24h (1 Day)", val: 24 },
              { label: "48h (2 Days Default)", val: 48 },
              { label: "72h (3 Days)", val: 72 },
              { label: "168h (7 Days)", val: 168 },
              { label: "Off (0h)", val: 0 }
            ].map((preset) => (
              <button
                key={preset.val}
                onClick={() => handleSaveSettings(preset.val)}
                disabled={savingSettings}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                  autoDeleteHours === preset.val 
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                style={autoDeleteHours !== preset.val ? { borderColor: themeColors.border, color: themeColors.text } : {}}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Input & Adjustment */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: themeColors.border }}>
              <button
                type="button"
                onClick={() => setSettingInput((prev) => Math.max(0, Number(prev) - 6))}
                className="px-2.5 py-1 text-xs font-bold border-r hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                -6h
              </button>
              <input
                type="number"
                min="0"
                value={settingInput}
                onChange={(e) => setSettingInput(e.target.value)}
                className="w-16 px-2 py-1 text-xs text-center font-bold focus:outline-none"
                style={{ backgroundColor: themeColors.background, color: themeColors.text }}
              />
              <span className="text-xs font-semibold px-1 opacity-70" style={{ color: themeColors.text }}>hrs</span>
              <button
                type="button"
                onClick={() => setSettingInput((prev) => Math.max(0, Number(prev) + 6))}
                className="px-2.5 py-1 text-xs font-bold border-l hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                +6h
              </button>
            </div>

            <button
              onClick={() => handleSaveSettings()}
              disabled={savingSettings}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white shadow-sm hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: themeColors.primary }}
            >
              {savingSettings ? "Saving..." : "Save Duration"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border shadow-sm p-4 space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Text Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-60">
                <FaSearch className="text-xs" style={{ color: themeColors.text }} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 text-xs font-semibold rounded-lg text-white"
              style={{ backgroundColor: themeColors.primary }}
            >
              Search
            </button>
          </form>

          {/* Colony Filter */}
          <div>
            <select
              value={colonyFilter}
              onChange={(e) => setColonyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
            >
              <option value="all">All Societies/Colonies</option>
              {colonies.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name} ({c.pincode})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Hidden</option>
              <option value="expired">Auto-Expired Only (&gt; {autoDeleteHours}h)</option>
              <option value="unexpired">Unexpired Only (&le; {autoDeleteHours}h)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table List Card */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <tr>
                {["Author", "Colony/Society", "Category", "Post Title", "Likes/Comments", "Status", "Actions"].map((head) => (
                  <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: themeColors.text }}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-xs opacity-75" style={{ color: themeColors.text }}>
                    No posts found matching the criteria.
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p._id || p.id}>
                    {/* Author */}
                    <td className="px-4 py-3 text-xs" style={{ color: themeColors.text }}>
                      <div className="font-semibold">{p.user?.fullName || "Anonymous"}</div>
                      <div className="text-[10px] opacity-70">{p.user?.mobileNumber || "-"}</div>
                    </td>

                    {/* Colony */}
                    <td className="px-4 py-3 text-xs" style={{ color: themeColors.text }}>
                      {p.colony?.name || "-"}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-xs" style={{ color: themeColors.text }}>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-gray-100">
                        {p.category || "Post"}
                      </span>
                    </td>

                    {/* Title & Created */}
                    <td className="px-4 py-3 text-xs" style={{ color: themeColors.text }}>
                      <div className="font-medium max-w-xs truncate">{p.title || "No Title"}</div>
                      <div className="text-[9px] opacity-70">{fmtDateTime(p.createdAt)}</div>
                    </td>

                    {/* Likes & Comments */}
                    <td className="px-4 py-3 text-xs" style={{ color: themeColors.text }}>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 opacity-70">
                          <FaHeart className="text-red-500 text-[10px]" /> {p.likes?.length || 0}
                        </span>
                        <span className="flex items-center gap-1 opacity-70">
                          <FaCommentAlt className="text-blue-500 text-[10px]" /> {p.comments?.length || 0}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-col items-start gap-1">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors duration-150"
                          style={{
                            backgroundColor: p.isActive ? themeColors.success + "15" : themeColors.danger + "15",
                            color: p.isActive ? themeColors.success : themeColors.danger
                          }}
                        >
                          {p.isActive ? <FaCheck className="text-[8px]" /> : <FaTimes className="text-[8px]" />}
                          {p.isActive ? "Active" : "Hidden"}
                        </button>
                        {p.isExpired && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/20">
                            <FaClock className="text-[8px]" /> Expired (&gt;{autoDeleteHours}h)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewPost(p)}
                          title="View Details"
                          className="p-1 rounded hover:bg-gray-100"
                          style={{ color: themeColors.primary }}
                        >
                          <FaEye className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(p)}
                          title="Delete"
                          className="p-1 rounded hover:bg-gray-100"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
            <span className="text-xs opacity-75" style={{ color: themeColors.text }}>
              Showing {posts.length} of {totalPosts} posts (Page {currentPage} of {totalPages})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded border disabled:opacity-50"
                style={{ borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.surface }}
              >
                Prev
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
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

      {/* Details Moderation Modal */}
      {viewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: themeColors.border }}>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-indigo-50 text-indigo-700">
                  {viewPost.category || "Post"}
                </span>
                <span className="text-xs opacity-75" style={{ color: themeColors.text }}>
                  by {viewPost.user?.fullName || "Anonymous"}
                </span>
              </div>
              <button
                onClick={() => { setViewPost(null); setActiveImageIndex(0); }}
                className="p-1 rounded-lg hover:bg-gray-100"
                style={{ color: themeColors.text }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Image slideshow */}
              {viewPost.images && viewPost.images.length > 0 && (
                <div className="relative rounded-xl overflow-hidden bg-black h-64 flex items-center justify-center">
                  <img
                    src={viewPost.images[activeImageIndex]}
                    alt="Post image"
                    className="h-full object-contain"
                  />
                  {viewPost.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex((idx) => (idx === 0 ? viewPost.images.length - 1 : idx - 1))}
                        className="absolute left-3 p-1.5 rounded-full bg-black bg-opacity-55 text-white"
                      >
                        <FaChevronLeft size={12} />
                      </button>
                      <button
                        onClick={() => setActiveImageIndex((idx) => (idx === viewPost.images.length - 1 ? 0 : idx + 1))}
                        className="absolute right-3 p-1.5 rounded-full bg-black bg-opacity-55 text-white"
                      >
                        <FaChevronRight size={12} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Title & Body */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>
                  {viewPost.title || "No Title"}
                </h2>
                <p className="text-sm whitespace-pre-line opacity-95" style={{ color: themeColors.text }}>
                  {viewPost.content}
                </p>
              </div>

              {/* Location details */}
              <div className="flex items-center gap-2 text-xs opacity-80" style={{ color: themeColors.text }}>
                <FaMapMarkerAlt />
                <span>Colony/Society: <strong>{viewPost.colony?.name || "-"}</strong> ({viewPost.colony?.pincode})</span>
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center gap-4 py-2 border-y text-xs" style={{ borderColor: themeColors.border, color: themeColors.text }}>
                <span className="flex items-center gap-1">
                  <FaHeart className="text-red-500" /> {viewPost.likes?.length || 0} Likes
                </span>
                <span className="flex items-center gap-1">
                  <FaRegComment className="text-blue-500" /> {viewPost.comments?.length || 0} Comments
                </span>
              </div>

              {/* Comments Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider opacity-75" style={{ color: themeColors.text }}>
                  Comments List
                </h3>
                {viewPost.comments && viewPost.comments.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {viewPost.comments.map((comm) => (
                      <div key={comm._id || comm.id} className="rounded-lg p-2.5 text-xs border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                        <div className="flex justify-between font-semibold mb-1" style={{ color: themeColors.text }}>
                          <span>{comm.user?.fullName || "Anonymous"}</span>
                          <span className="text-[10px] opacity-75 font-normal">{fmtDateTime(comm.createdAt)}</span>
                        </div>
                        <p style={{ color: themeColors.text }}>{comm.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs opacity-75" style={{ color: themeColors.text }}>No comments yet.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t flex items-center justify-between bg-gray-50" style={{ borderColor: themeColors.border }}>
              <button
                onClick={() => handleToggleStatus(viewPost)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2"
                style={{
                  backgroundColor: viewPost.isActive ? themeColors.danger + "20" : themeColors.success + "20",
                  color: viewPost.isActive ? themeColors.danger : themeColors.success,
                  borderColor: viewPost.isActive ? themeColors.danger + "40" : themeColors.success + "40"
                }}
              >
                {viewPost.isActive ? <FaTimes /> : <FaCheck />}
                {viewPost.isActive ? "Flag / Hide Post" : "Restore Post"}
              </button>

              <button
                onClick={() => handleDeletePost(viewPost)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 flex items-center gap-1.5"
              >
                <FaTrash />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

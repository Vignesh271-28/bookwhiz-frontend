import { useEffect, useState } from "react";
import FilterPanel, { applyFilters } from "../../layouts/FilterPanel.jsx";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { toast } from "react-toastify";
import ConfirmModal from "../popup/ConfirmModel.jsx";
import { API } from "../../config/api.js";


// const API  = "http://localhost:8080/api/superadmin/requests";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const TYPE_ICON    = { MOVIE: "🎬", VENUE: "🏛️", USER: "👤" };
const STATUS_STYLE = {
  PENDING:              "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  AWAITING_SUPERADMIN:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  "Awaiting SuperAdmin":"bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  APPROVED:             "bg-green-500/10  text-green-400  border-green-500/25",
  REJECTED:             "bg-red-500/10   text-red-400    border-red-500/25",
};
const getStatusStyle = (status) => {
  if (!status) return STATUS_STYLE.PENDING;
  if (STATUS_STYLE[status]) return STATUS_STYLE[status];
  const s = String(status).toLowerCase();
  if (s.includes("await") || s.includes("pending")) return STATUS_STYLE.PENDING;
  if (s.includes("approv")) return STATUS_STYLE.APPROVED;
  if (s.includes("reject")) return STATUS_STYLE.REJECTED;
  return "bg-gray-500/10 text-gray-400 border-gray-500/25";
};

// Treat any "awaiting" or "pending" status as pending for button display
const isPending = (status) => {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === "pending" || s.includes("await") || s.includes("pending");
};

export default function ApprovalQueueTab({ defaultFilter = "PENDING", showTabs = true }) {
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState(defaultFilter);
  const [approvalFilters, setApprovalFilters] = useState({ userSearch: [], types: [] });
  const [search, setSearch] = useState("");
  const [expanded,  setExpanded]  = useState(null);
  const [acting,    setActing]    = useState(null);

  // Reject modal state
  const [rejectId,    setRejectId]    = useState(null);
  const [rejectNote,  setRejectNote]  = useState("");
  const [noteError,   setNoteError]   = useState("");
  const [rejecting,   setRejecting]   = useState(false);

  // Approve confirm state
  const [approveConfirmId,      setApproveConfirmId]      = useState(null);
  const [approveConfirmSummary, setApproveConfirmSummary] = useState("");

  const load = () => {
    setLoading(true);
    axios.get(`${API.SUPER_ADMIN}/requests`, { headers: auth() })
      .then(r => setRequests(r.data ?? []))
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = {
    ALL:      requests.length,
    PENDING:  requests.filter(r => isPending(r.status)).length,
    APPROVED: requests.filter(r => r.status === "APPROVED").length,
    REJECTED: requests.filter(r => r.status === "REJECTED").length,
  };

  const fpFiltered = applyFilters(requests, "approvals", approvalFilters);
  const searchFiltered = search.trim()
    ? fpFiltered.filter(r =>
        r.requestedByName?.toLowerCase().includes(search.toLowerCase()) ||
        r.requestedByEmail?.toLowerCase().includes(search.toLowerCase()) ||
        r.summary?.toLowerCase().includes(search.toLowerCase())
      )
    : fpFiltered;
  const filtered = filter === "ALL"
    ? searchFiltered
    : filter === "PENDING"
    ? searchFiltered.filter(r => isPending(r.status))
    : searchFiltered.filter(r => r.status === filter);

  // ── Approve ───────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActing(id + "approve");
    try {
      await axios.post(`${API.SUPER_ADMIN}/requests/${id}/approve`, {}, { headers: auth() });
      toast.success("✅ Approved & created!");
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to approve");
    } finally {
      setActing(null);
      setApproveConfirmId(null);
    }
  };

  // ── Open reject modal ─────────────────────────────────────
  const openReject = (id) => {
    setRejectId(id);
    setRejectNote("");
    setNoteError("");
  };

  // ── Submit reject ─────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectNote.trim()) {
      setNoteError("A reason is required before rejecting.");
      return;
    }
    setRejecting(true);
    try {
      await axios.post(`${API.SUPER_ADMIN}/requests/${rejectId}/reject`,
        { note: rejectNote.trim() }, { headers: auth() });
      toast.success("Request rejected.");
      load();
      setRejectId(null);
      setRejectNote("");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  const formatDate = (dt) => dt
    ? new Date(dt).toLocaleString("en-IN", {
        day:"2-digit", month:"short", year:"numeric",
        hour:"2-digit", minute:"2-digit", hour12: true
      })
    : "—";

  const prettyPayload = (json) => {
    try { return JSON.stringify(JSON.parse(json), null, 2); }
    catch { return json; }
  };

  return (
    <div className="space-y-5">

      {/* ── Filter tabs ── */}
      {/* Search bar */}
      <div style={{ position:"relative", marginBottom:12 }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
          fontSize:14, opacity:0.4 }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by user, email or summary..."
          style={{
            width:"100%", boxSizing:"border-box",
            border:"1.5px solid #e5e7eb", borderRadius:10,
            padding:"9px 12px 9px 36px", fontSize:13,
            outline:"none", color:"#111", background:"#fff"
          }}
          onFocus={e => e.target.style.borderColor="#7c3aed"}
          onBlur={e => e.target.style.borderColor="#e5e7eb"}
        />
      </div>

      {showTabs && (
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {["PENDING","APPROVED","REJECTED","ALL"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest
                        border transition
                        ${filter === f
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-white/[0.04] text-white/40 border-white/10 hover:border-red-500/30"}`}>
            {f}
            {counts[f] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]
                ${filter === f ? "bg-white/20" : "bg-white/10"}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
        </div>
        <FilterPanel tab="approvals" filters={approvalFilters} onChange={setApprovalFilters} data={requests} />
        {(approvalFilters.userSearch?.length || approvalFilters.types?.length) ? (
          <button onClick={() => { setApprovalFilters({ userSearch:[], types:[] }); setSearch(""); }}
            style={{ display:"inline-flex", alignItems:"center", gap:5,
              padding:"7px 12px", borderRadius:10,
              background:"#fef2f2", border:"1px solid #fecaca",
              color:"#ef4444", fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap" }}>
            ✕ Clear
          </button>
        ) : null}
      </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-white/[0.02]
                        border border-white/[0.06] rounded-2xl">
          <p className="text-4xl opacity-20 mb-3">📭</p>
          <p className="text-white/40 font-bold">No {filter.toLowerCase()} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id}
              className="bg-black border border-white/[0.08] rounded-2xl overflow-hidden
                         hover:border-red-500/20 transition">

              {/* Row */}
              <div className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-2xl shrink-0">{TYPE_ICON[req.type] ?? "📄"}</span>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">{req.summary}</p>
                    <p className="text-white/30 text-xs mt-0.5">
                      By <span className="text-white/50">{req.requestedByName}</span>
                      <span className="text-white/20"> · </span>
                      {formatDate(req.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black uppercase tracking-widest
                                    px-3 py-1 rounded-full border ${getStatusStyle(req.status)}`}>
                    {req.status}
                  </span>

                  {isPending(req.status) && (
                    <>
                      <button
                        onClick={() => { setApproveConfirmId(req.id); setApproveConfirmSummary(req.summary); }}
                        disabled={!!acting}
                        className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400
                                   border border-green-500/25 text-xs font-black
                                   hover:bg-green-500 hover:text-white transition
                                   disabled:opacity-40 disabled:cursor-not-allowed">
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => openReject(req.id)}
                        disabled={!!acting}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400
                                   border border-red-500/20 text-xs font-black
                                   hover:bg-red-500 hover:text-white transition
                                   disabled:opacity-40 disabled:cursor-not-allowed">
                        ✕ Reject
                      </button>
                    </>
                  )}

                  <button onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                    className="w-7 h-7 rounded-lg bg-white/[0.05] text-white/30
                               hover:text-white/70 hover:bg-white/10 transition text-xs font-bold">
                    {expanded === req.id ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {/* Expanded payload */}
              {expanded === req.id && (
                <div className="border-t border-white/[0.06] px-5 py-4 space-y-3">
                  <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-2">
                    Request Payload
                  </p>
                  <pre className="bg-white/[0.03] border border-white/[0.07] rounded-xl
                                  px-4 py-3 text-xs text-green-400/80 overflow-x-auto
                                  font-mono leading-6 max-h-64">
                    {prettyPayload(req.payload)}
                  </pre>
                  {req.reviewNote && (
                    <div>
                      <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-1">
                        Rejection Reason
                      </p>
                      <p className="text-red-400/70 text-sm">{req.reviewNote}</p>
                    </div>
                  )}
                  {req.reviewedAt && (
                    <p className="text-white/20 text-xs">Reviewed: {formatDate(req.reviewedAt)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Approve confirm modal ── */}
      <ConfirmModal
        open={approveConfirmId !== null}
        variant="success"
        title="Approve Request?"
        message={`This will immediately create the record: "${approveConfirmSummary}". This cannot be undone.`}
        confirmLabel="✓ Yes, Approve"
        cancelLabel="Cancel"
        onConfirm={() => handleApprove(approveConfirmId)}
        onCancel={() => setApproveConfirmId(null)}
      />

      {/* ── Reject modal — reason is MANDATORY ── */}
      {rejectId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
                        bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-gray-950 border border-white/10 rounded-2xl p-6
                          w-full max-w-md shadow-2xl space-y-4">

            <div className="flex items-center gap-3">
              <span className="text-2xl">🚫</span>
              <div>
                <h3 className="text-white font-black text-lg">Reject Request</h3>
                <p className="text-white/30 text-xs mt-0.5">A reason is required to reject.</p>
              </div>
            </div>

            <div>
              <label className="block text-white/30 text-[10px] font-black
                                uppercase tracking-widest mb-1.5">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectNote}
                onChange={e => { setRejectNote(e.target.value); setNoteError(""); }}
                rows={4}
                placeholder="Explain why this request is being rejected…"
                className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3
                            text-white text-sm placeholder-white/20 resize-none
                            focus:outline-none focus:ring-2 transition
                            ${noteError
                              ? "border-red-500/60 focus:ring-red-500/40"
                              : "border-white/10 focus:ring-red-500/30 focus:border-red-500/40"}`}
              />
              {noteError && (
                <p className="mt-1.5 text-[11px] text-red-400 font-semibold flex items-center gap-1">
                  <span>⚠</span> {noteError}
                </p>
              )}
              <p className="mt-1.5 text-white/20 text-[11px]">
                This reason will be visible to the requester.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setRejectId(null); setRejectNote(""); setNoteError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/40
                           border border-white/10 hover:text-white/70 hover:border-white/20 transition">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black text-white transition
                  ${rejecting
                    ? "bg-white/[0.05] cursor-not-allowed text-white/20"
                    : "bg-red-500 hover:bg-red-600"}`}>
                {rejecting ? "Rejecting…" : "✕ Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
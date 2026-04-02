import { useState, useRef, useEffect } from "react";

const TYPE_ICON = {
  REQUEST_SUBMITTED: "",
  REQUEST_APPROVED:  "",
  REQUEST_REJECTED:  "",
};

const TYPE_COLOR = {
  REQUEST_SUBMITTED: "border-l-blue-400",
  REQUEST_APPROVED:  "border-l-green-400",
  REQUEST_REJECTED:  "border-l-red-400",
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/**
 * NotificationBell
 *
 * Props:
 *   notifications  {Array}
 *   unreadCount    {number}
 *   markAllRead    {function}
 *   markOneRead    {function}
 */
export default function NotificationBell({
  notifications = [],
  unreadCount   = 0,
  markAllRead,
  markOneRead,
}) {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(p => !p);
  };

  return (
    <div className="relative" ref={ref}>

      {/* ── Bell button ── */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center
                   rounded-xl bg-white/[0.06] hover:bg-white/10 transition
                   border border-white/10 hover:border-white/20">
        <span className="text-base">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                           bg-red-500 text-white text-[10px] font-black
                           rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 bg-gray-950
                        border border-white/10 rounded-2xl shadow-2xl
                        flex flex-col max-h-[480px] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-white/[0.07] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400
                                 text-[10px] font-black rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="text-[11px] text-white/30 hover:text-white/60 transition font-semibold">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-white/[0.05]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-white/20">
                <span className="text-3xl mb-2">🔕</span>
                <p className="text-xs font-semibold">No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { if (!n.read) markOneRead(n.id); }}
                className={`w-full text-left px-4 py-3 flex gap-3 items-start
                            transition border-l-2 ${TYPE_COLOR[n.type] ?? "border-l-white/10"}
                            ${n.read
                              ? "bg-transparent hover:bg-white/[0.03]"
                              : "bg-white/[0.04] hover:bg-white/[0.07]"}`}>
                <span className="text-lg mt-0.5 shrink-0">{TYPE_ICON[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate
                                 ${n.read ? "text-white/40" : "text-white"}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-white/20 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/[0.07] px-4 py-2.5 shrink-0">
              <p className="text-[10px] text-white/20 text-center">
                {notifications.length} total notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
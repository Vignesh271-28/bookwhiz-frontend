import { useState, useEffect } from "react";
import { usePermissions } from "../hooks/userPermissions.js";
import { clearToken, getUserFromToken } from "../utils/jwtUtil";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications.js";
import NotificationBell from "../components/NotificationBell.jsx";
import axios from 'axios';
import { API } from "../config/api.js";
import {
  LayoutDashboard, DollarSign, BarChart2, Users, Activity,
  BookOpen, Film, Clock, Building2, CalendarClock, CheckSquare,
  CheckCircle, XCircle, List, Handshake, Shield, Ticket,
  Home, LogOut, ChevronDown, Menu, ScanLine, Send,
  PieChart, Clapperboard, MapPin, BarChart, ClipboardList,
  TrendingUp, UserCheck, Radio, Wallet, Star, Settings
} from "lucide-react";


const NAV = {
  SUPER_ADMIN: {
    brand:    "BookWhiz",
    subtitle: "Super Admin",
    accent:   "#ef4444",          // red-500
    ring:     "rgba(239,68,68,0.12)",
    items: [
      // { id: "home",       label: "Home",       icon: ic(Home) },
      // { id: "mybookings", label: "My Bookings",   icon: ic(Ticket)    },
      { id: "overview",   label: "Overview",        con: ic(LayoutDashboard),
        children: [
          // { id: "overview:main",    label: "Dashboard",         icon: "◈"  },
          { id: "revenueanalytics", label: "Revenue",          icon: ic(DollarSign, 13)    },
          { id: "bookinganalytics", label: "Booking Analytics", icon: ic(BarChart2, 13)        },
          { id: "useranalytics",    label: "User Analytics",    icon: ic(Users, 13)            },
          { id: "live",             label: "Live Activity",     icon: ic(Radio, 13)   },
        ]
      },
      { id: "allbookings",label: "All Bookings",     icon: ic(BookOpen)                                   },
      { id: "users",      label: "Users",           icon: ic(Users)                                    },
      { id: "movies",     label: "Movies & Events", icon: ic(Film)                                   },
      { id: "shows",      label: "Show Timings",    icon: ic(Film)                                    },
      { id: "venues",     label: "Venues",         icon: ic(Building2)                                     },
      { id: "events",      label: "Pending Events",  icon: ic(CalendarClock)                                   },
      { id: "approvals",   label: "Approvals",         icon: ic(CheckSquare),  
        children: [
          { id: "approvals:pending",  label: "Pending",  icon: ic(Clock, 13)  }  ,
          { id: "approvals:approved", label: "Approved", icon: ic(CheckCircle, 13) },
          { id: "approvals:rejected", label: "Rejected", icon: ic(XCircle, 13)      },
          { id: "approvals:all",      label: "All",      icon: ic(List, 13)  },
        ]
      },
      { id: "partners",    label: "Partner Requests",  icon: ic(Handshake),
        children: [
          { id: "partners:pending",  label: "Pending", icon: ic(Clock, 13) }   ,
          { id: "partners:approved", label: "Approved", icon: ic(CheckCircle, 13) },
          { id: "partners:rejected", label: "Rejected", icon: ic(XCircle, 13)      },
          { id: "partners:all",      label: "All",      icon: ic(List, 13)   },
        ]
      },
      { id: "roles",        label: "Role Management",    icon: ic(Users)                                   },
      { id: "permissions",  label: "Permissions",         icon: ic(Shield)                                     },
    ],
  },
  ADMIN: {
    brand:    "BookWhiz",
    subtitle: "Admin Panel",
    accent:   "#ef4444",
    ring:     "rgba(239,68,68,0.12)",
    items: [
      { id: "overview",    label: "Overview",          icon: ic(LayoutDashboard),  permKey: "ADMIN_DASHBOARD"   },
      { id: "analytics",   label: "Analytics",         icon: ic(BarChart2),
        children: [
          { id: "bookinganalytics", label: "Booking Analytics",  icon: ic(BarChart2, 13),  permKey: "BOOKING_ANALYTICS" },
          { id: "live",             label: "Live Activity",  icon: ic(Radio, 13),      permKey: "LIVE_ANALYTICS"    },
          { id: "revenueanalytics", label: "Revenue",       icon: ic(DollarSign, 13),     permKey: "REVENUE_ANALYTICS" },
          { id: "useranalytics",    label: "User Analytics",   icon: ic(Users, 13),   permKey: "USER_ANALYTICS"    },
        ]
      },
      { id: "bookings",  label: "Bookings",         icon: ic(Ticket),      permKey: "BOOKING_VIEW"    },
      { id: "users",     label: "Users",        icon: ic(Users),                permKey: "USER_VIEW"       },
      { id: "movies",    label: "Movies",        icon: ic(Film),                permKey: "MOVIE_VIEW"      },
      { id: "shows",     label: "Show Timings",   icon: ic(Clock),        permKey: "SHOW_VIEW"       },
      { id: "venues",    label: "Venues",      icon: ic(Building2),        permKey: "VENUE_VIEW"      },
      { id: "approvals", label: "Approvals",     icon: ic(CheckSquare),       permKey: "APPROVAL_VIEW",
        children: [
          { id: "approvals:pending",  label: "Pending", icon: ic(Clock, 13)}  ,
          { id: "approvals:approved", label: "Approved", icon: ic(CheckCircle, 13)}  ,
          { id: "approvals:rejected", label: "Rejected", icon: ic(XCircle, 13)}      ,
          { id: "approvals:all",      label: "All",   icon: ic(List, 13)}    ,
        ]
      },
      // { id: "requests",    label: "Request Creation",  icon: "📤"                                     },
      { id: "permissions", label: "Permissions",       icon: ic(Shield),   permKey: "PERMISSION_MANAGE"       },
      { id: "partners",  label: "Partner Requests", icon: ic(Handshake),    permKey: "PARTNER_APPROVE",
        children: [
          { id: "partners:pending",  label: "Pending", icon: ic(Clock, 13)  },
          { id: "partners:approved", label: "Approved", icon: ic(CheckCircle, 13) },
          { id: "partners:rejected", label: "Rejected", icon: ic(XCircle, 13) },
          { id: "partners:all",      label: "All",   icon: ic(List, 13)    },
        ]
      },
    ],
  },
  MANAGER: {
    brand:    "BookWhiz",
    subtitle: "Theater Owner",
    accent:   "#f97316",
    ring:     "rgba(249,115,22,0.12)",
    items: [
      { id: "overview",  label: "Dashboard",        icon: ic(LayoutDashboard)  },
      { id: "movies",    label: "My Movies",         icon: ic(Film)},
      { id: "shows",     label: "Show Revenue",       icon: ic(TrendingUp)  },
      { id: "bookings",  label: "Booking Details",   icon: ic(Ticket) },
      { id: "today",     label: "Today's Report",    icon: ic(BarChart)   },
      { id: "requests",  label: "Request Movie",      icon: ic(Send)   },
    ],
  },
  PARTNER: {
    brand:    "BookWhiz",
    subtitle: "Partner Portal",
    accent:   "#8b5cf6",
    ring:     "rgba(139,92,246,0.12)",
    items: [
      { id: "overview",  label: "Dashboard",         icon: ic(LayoutDashboard)                              },
      { id: "venues",    label: "My Theatres",        icon: ic(Building2),  permKey: "VENUE_VIEW"    },
      { id: "shows",     label: "Show Schedule",     icon: ic(Clapperboard),permKey: "SHOW_VIEW"     },
      { id: "bookings",  label: "Bookings",          icon: ic(Ticket), permKey: "BOOKING_VIEW"  },
      { id: "analytics", label: "Analytics",        icon: ic(PieChart),   permKey: "ANALYTICS_VIEW"},
      { id: "scanner",   label: "Scan Tickets",      icon: ic(ScanLine)                              },
      { id: "movies",    label: "Request Movie",     icon: ic(Send)                               },
    ],
  },
  USER: {
    brand:    "BookWhiz",
    subtitle: "My Account",
    accent:   "#ef4444",
    ring:     "rgba(239,68,68,0.12)",
    items: [
      { id: "overview", label: "Overview",      icon: ic(LayoutDashboard)  },
      { id: "bookings", label: "My Bookings",  icon: ic(Ticket)  },
      { id: "profile",  label: "Profile",     icon: ic(UserCheck)       },
    ],
  },
};

export default function DashboardLayout({
  role = "USER", activeTab, setActiveTab, pendingCount = 0, children
}) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDrops,  setOpenDrops]  = useState({ approvals: true, partners: false, overview: true, analytics: true });
  const navigate = useNavigate();
  const config        = NAV[role] ?? NAV.USER;
  const user          = getUserFromToken();
  const { can } = usePermissions();
  const [customRole, setCustomRole] = useState(null);
  const [customRoleMeta, setCustomRoleMeta]  = useState();

  useEffect(() => {
    const token = (() => {
      try {
        return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
      } catch { return null; }
    })();
    if (!token) return;
    axios.get(API.ROLES, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      if (r.data && r.data.name) setCustomRole(r.data);
      else setCustomRole(null);
    }).catch(() => setCustomRole(null));
  }, [role]);

  // Map role to permission role key
  const permRole = role === "ADMIN"   ? "ADMIN"
                 : role === "PARTNER" ? "MANAGER"
                 : role === "USER"    ? "USER"
                 : null;

  // Filter nav items — hide any item whose permKey is disabled for this role
  const visibleItems = config.items.filter(item => {
    if (!item.permKey || !permRole) return true;   // no permKey = always show
    return can(item.permKey);
  });

  const { notifications, unreadCount, markAllRead, markOneRead } =
    useNotifications(role, user?.email ?? user?.sub);

  const handleLogout = () => { clearToken(); window.location.href = "/login"; };

  const SidebarContent = () => {
    return (
    <div className="flex flex-col h-full">

      {/* ── Brand ── */}
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <div>
              <h1 className="text-white font-black text-xl tracking-tight">
                {config.brand}
              </h1>
              <p className="text-red-500 text-xs font-bold uppercase
                            tracking-widest mt-0.5">
                {config.subtitle}
              </p>
            </div>
          ) : (
            <span className="text-red-500 font-black text-2xl">B</span>
          )}

          <button onClick={() => setCollapsed(p => !p)}
            className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center
                       text-white/20 hover:text-white hover:bg-white/10
                       transition text-sm border border-white/10">
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* User badge */}
        {!collapsed && (
          <div className="mt-5 flex items-center gap-3 px-3 py-3 rounded-xl
                          border border-red-500/20 bg-red-500/10">
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center
                            justify-center text-sm font-black shrink-0 text-white">
              {user?.sub?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate leading-tight">
                {user?.name ?? user?.sub ?? "User"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate"
                style={{ color: customRoleMeta ? customRoleMeta.color : "#f87171" }}>
                {customRoleMeta
                  ? `${customRoleMeta.icon} ${customRoleMeta.name}`
                  : role.replace("_", " ")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 h-px bg-white/[0.07] mb-3" />

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-white/20 text-[10px] font-black uppercase
                        tracking-[0.15em] mb-3 px-3 pt-1">
            Navigation
          </p>
        )}

        {visibleItems.map(item => {
          const hasChildren  = item.children && item.children.length > 0;
          const isDropOpen   = openDrops[item.id];
          // parent is "active" if activeTab starts with its id
          const active       = activeTab === item.id ||
            (hasChildren && item.children.some(c => c.id === activeTab));

          const handleClick = () => {
            if (item.path)         { navigate(item.path); setMobileOpen(false); return; }
            if (hasChildren) {
              // toggle dropdown; navigate to first child by default
              setOpenDrops(p => ({ ...p, [item.id]: !p[item.id] }));
              if (!item.children.some(ch => ch.id === activeTab)) {
                setActiveTab(item.children[0].id);
              }
            } else {
              setActiveTab(item.id);
            }
            setMobileOpen(false);
          };

          return (
            <div key={item.id}>
              {/* Parent nav item */}
              <button
                onClick={handleClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            text-sm font-semibold transition-all duration-150 group
                            ${active && !hasChildren
                              ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                              : active && hasChildren
                                ? "bg-white/[0.06] text-white"
                                : "text-white/40 hover:text-white hover:bg-white/[0.06]"}`}>

                <span className={`text-base shrink-0 transition-transform
                                  ${active ? "scale-110" : "group-hover:scale-105"}`}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {/* Badge */}
                {!collapsed && (item.id === "approvals" || item.id === "partners") && pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px]
                                   font-black bg-red-500 text-white min-w-[18px] text-center">
                    {pendingCount}
                  </span>
                )}

                {/* Dropdown chevron */}
                {!collapsed && hasChildren && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    style={{ transition:"transform 0.2s", flexShrink:0,
                      transform: isDropOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                )}

                {!collapsed && !hasChildren && active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                )}
              </button>

              {/* Dropdown children */}
              {!collapsed && hasChildren && isDropOpen && (
                <div style={{ marginLeft:12, marginTop:2, marginBottom:4 }}>
                  {/* Vertical connector line */}
                  <div style={{ position:"relative" }}>
                    <div style={{
                      position:"absolute", left:10, top:0, bottom:0,
                      width:1, background:"rgba(255,255,255,0.08)"
                    }} />
                    {item.children.filter(child => !child.permKey || !permRole || can(child.permKey)).map((child, ci) => {
                      const childActive = activeTab === child.id;
                      const isLast = ci === item.children.length - 1;
                      return (
                        <button key={child.id}
                          onClick={() => { setActiveTab(child.id); setMobileOpen(false); }}
                          style={{ position:"relative" }}
                          className={`w-full flex items-center gap-2.5 pl-7 pr-3 py-2
                                      rounded-xl text-xs font-semibold transition-all
                                      ${childActive
                                        ? "bg-red-500/15 text-red-400"
                                        : "text-white/30 hover:text-white/70 hover:bg-white/[0.04]"}`}>

                          {/* Branch connector */}
                          <div style={{
                            position:"absolute", left:10, top:"50%",
                            width:12, height:1,
                            background: childActive ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"
                          }} />

                          <span style={{ fontSize:11 }}>{child.icon}</span>
                          <span>{child.label}</span>

                          {childActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Logout ── */}
      <div className="px-3 pb-5 pt-3 border-t border-white/[0.07] mt-2">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                     text-white/30 hover:text-red-400 hover:bg-red-500/10
                     text-sm font-semibold transition-all group">
          <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
            🚪
          </span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
  }
  return (
    <div className="flex h-screen overflow-hidden bg-black">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:relative z-50 lg:z-auto h-full flex flex-col shrink-0
          transition-all duration-300 ease-in-out bg-black
          border-r border-white/[0.07]
          ${collapsed ? "w-[72px]" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ boxShadow: "4px 0 30px rgba(0,0,0,0.6)" }}>
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-black border-b border-white/[0.07] px-6 py-4
                           flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {/* Hamburger */}
            <button onClick={() => setMobileOpen(p => !p)}
              className="lg:hidden w-9 h-9 rounded-xl border border-white/10
                         bg-white/[0.05] text-white/50 hover:text-white
                         hover:bg-white/10 flex items-center justify-center
                         transition text-base">
              ☰
            </button>

            {/* Breadcrumb */}
            <div>
              {/* Build breadcrumb trail */}
              {(() => {
                // Find parent + child for dropdown tabs
                const parent = visibleItems.find(item =>
                  item.children?.some(ch => ch.id === activeTab)
                );
                const child  = parent?.children?.find(ch => ch.id === activeTab);
                const direct = !parent && visibleItems.find(i => i.id === activeTab);

                const crumbs = [
                  { label: config.subtitle, dim: true },
                  ...(parent ? [
                    { label: parent.label, icon: parent.icon, dim: false, action: () => {} },
                    { label: child?.label, icon: child?.icon, dim: false, active: true },
                  ] : [
                    { label: direct?.label ?? "Dashboard", icon: direct?.icon, dim: false, active: true }
                  ])
                ];

                return (
                  <div style={{ display:"flex", alignItems:"center", gap:0 }}>
                    {crumbs.map((crumb, i) => (
                      <span key={i} style={{ display:"flex", alignItems:"center", gap:0 }}>
                        {i > 0 && (
                          <span style={{
                            color:"rgba(255,255,255,0.15)",
                            fontSize:12, margin:"0 5px",
                            fontWeight:400
                          }}>›</span>
                        )}
                        <span style={{
                          fontSize: i === 0 ? 10 : crumb.active ? 14 : 12,
                          fontWeight: crumb.active ? 800 : i === 0 ? 700 : 500,
                          color: crumb.dim
                            ? "rgba(255,255,255,0.2)"
                            : crumb.active
                              ? "#fff"
                              : "rgba(255,255,255,0.45)",
                          letterSpacing: i === 0 ? "0.1em" : "-0.2px",
                          textTransform: i === 0 ? "uppercase" : "none",
                          display:"flex", alignItems:"center", gap:4,
                          cursor: crumb.action ? "pointer" : "default",
                          transition:"color 0.15s"
                        }}>
                          {crumb.icon && <span style={{ fontSize:11 }}>{crumb.icon}</span>}
                          {crumb.label}
                        </span>
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              markAllRead={markAllRead}
              markOneRead={markOneRead}
            />

            {/* Role pill */}
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5
                             text-[11px] font-black uppercase tracking-widest
                             rounded-full border"
              style={customRoleMeta
                ? { background: `${customRoleMeta.color}15`, color: customRoleMeta.color,
                    borderColor: `${customRoleMeta.color}40` }
                : { background: "rgba(239,68,68,0.1)", color: "#f87171",
                    borderColor: "rgba(239,68,68,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: customRoleMeta ? customRoleMeta.color : "#ef4444" }} />
              {customRoleMeta ? `${customRoleMeta.icon} ${customRoleMeta.name}` : role.replace("_", " ")}
            </span>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center
                            justify-center text-sm font-black text-white
                            cursor-pointer hover:bg-red-600 transition hover:scale-105">
              {user?.sub?.[0]?.toUpperCase() ?? "?"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
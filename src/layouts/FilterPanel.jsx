import { useState, useEffect, useRef } from "react";

const darkInputStyle = `
  input::placeholder { color: rgba(255,255,255,0.25) !important; }
  select option { background: #1a1a1a; color: #fff; }
`;

/**
 * FilterPanel — slide-in panel from the right.
 * Supports: multi-select checkboxes, chip-input boxes, text search.
 *
 * Props:
 *   tab      — active tab name
 *   filters  — current filter state object
 *   onChange — callback(newFilters)
 *   data     — raw data array (for dynamic option lists)
 */
export default function FilterPanel({ tab, filters, onChange, data = [] }) {
  const [open,          setOpen]          = useState(false);
  const [pendingFilters, setPendingFilters] = useState(filters);
  const panelRef = useRef(null);

  // Sync pending state when panel opens
  useEffect(() => {
    if (open) setPendingFilters(filters);
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (open && panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const config = TAB_CONFIGS[tab];
  if (!config) return null;

  // Badge on icon reflects APPLIED filters; panel header reflects PENDING
  const activeCount = Object.entries(filters).filter(([, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    return v && v !== "ALL" && v !== "";
  }).length;
  const pendingCount = Object.entries(pendingFilters).filter(([, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    return v && v !== "ALL" && v !== "";
  }).length;

  // Update local pending state only — not committed until Apply clicked
  const set = (key, val) => setPendingFilters(p => ({ ...p, [key]: val }));

  const clearAll = () => {
    const reset = {};
    config.sections.forEach(s => {
      reset[s.key] = s.type === "chips" ? [] : "ALL";
    });
    setPendingFilters(reset);
    onChange(reset);   // immediately clear applied filters too
  };

  return (
    <>
      {/* Trigger button */}
      <button onClick={() => setOpen(p => !p)} title="Filters" style={{
        position: "relative",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 38, height: 38, borderRadius: 10,
        background: open ? "#ef4444" : activeCount > 0 ? "rgba(239,68,68,0.12)" : "#f3f4f6",
        border: activeCount > 0 ? "1.5px solid rgba(239,68,68,0.3)" : "1.5px solid transparent",
        cursor: "pointer", transition: "all 0.2s", flexShrink: 0
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke={open || activeCount > 0 ? (open ? "#fff" : "#ef4444") : "#6b7280"}
          strokeWidth="2.5" strokeLinecap="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        {activeCount > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            width: 16, height: 16, borderRadius: "50%",
            background: "#ef4444", color: "#fff",
            fontSize: 9, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>{activeCount}</span>
        )}
      </button>

      {/* Backdrop */}
      {open && <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 998, backdropFilter: "blur(2px)"
      }} />}

      {/* Panel */}
      <div ref={panelRef} style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 300, zIndex: 999,
        background: "#0d0d0d",
        boxShadow: "-8px 0 48px rgba(0,0,0,0.7), -1px 0 0 rgba(255,255,255,0.06)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        fontFamily: "DM Sans, system-ui, sans-serif"
      }}>
        <style>{darkInputStyle}</style>
        {/* Red top accent */}
        <div style={{
          position:"absolute", top:0, left:"10%", right:"10%", height:1,
          background:"linear-gradient(90deg,transparent,#ef4444,transparent)"
        }} />

        {/* Header */}
        <div style={{
          padding: "20px 20px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing:"-0.3px" }}>
              Filter By
            </span>
            {activeCount > 0 && (
              <span style={{
                background:"#ef4444", color:"#fff",
                fontSize:10, fontWeight:800, borderRadius:20,
                padding:"1px 7px"
              }}>{activeCount}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeCount > 0 && (
              <button onClick={clearAll} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#ef4444", fontWeight: 600, padding: 0
              }}>Clear all</button>
            )}
            <button onClick={() => setOpen(false)} style={{
              background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1,
              width:26, height:26, borderRadius:6,
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>✕</button>
          </div>
        </div>

        {/* Sections */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {config.sections.map(section => (
            <PanelSection key={section.key}
              section={section}
              value={pendingFilters[section.key]}
              onChange={v => set(section.key, v)}
              data={data}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)"
        }}>
          <button onClick={() => { onChange(pendingFilters); setOpen(false); }} style={{
            width: "100%", padding: "12px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            border: "none", borderRadius: 10,
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(239,68,68,0.4)",
            letterSpacing:"0.02em"
          }}>
            Apply Filters {pendingCount > 0 && `(${pendingCount} active)`}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Individual section renderer ───────────────────────────────────
function PanelSection({ section, value, onChange, data }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button onClick={() => setCollapsed(p => !p)} style={{
        width: "100%", padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "none", border: "none", cursor: "pointer",
        transition: "background 0.15s"
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{section.label}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"
          style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)", transition: "0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {!collapsed && (
        <div style={{ padding: "0 20px 14px" }}>
          {section.type === "chips"    && <ChipInput  section={section} value={value || []} onChange={onChange} data={data} />}
          {section.type === "multi"    && <MultiCheck section={section} value={value || []} onChange={onChange} data={data} />}
          {section.type === "single"   && <SingleCheck section={section} value={value || "ALL"} onChange={onChange} data={data} />}
          {section.type === "range"    && <RangeSelect section={section} value={value || "ALL"} onChange={onChange} />}
        </div>
      )}
    </div>
  );
}

// ── Chip Input — type + Enter to add chip ─────────────────────────
function ChipInput({ section, value = [], onChange, data }) {
  const [text, setText] = useState("");

  // Dynamic suggestions from data
  let suggestions = [];
  if (section.dynamic && data.length > 0) {
    if (section.dynamic === "_emailDomain") {
      suggestions = [...new Set(data.map(d => d.email?.split("@")[1]).filter(Boolean))].sort();
    } else if (section.dynamic === "_movieTitle") {
      suggestions = [...new Set(data.map(d => d.movie?.title ?? d.movieTitle).filter(Boolean))].sort();
    } else if (section.dynamic === "_venueName") {
      suggestions = [...new Set(data.map(d => d.venue?.name ?? d.venueName).filter(Boolean))].sort();
    } else {
      suggestions = [...new Set(data.map(d => d[section.dynamic]).filter(Boolean))].sort();
    }
  }

  const filtered_suggestions = text.trim().length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(text.toLowerCase()) && !value.includes(s))
    : [];

  const addChip = (v) => {
    const trimmed = v.trim();
    if (!trimmed || value.includes(trimmed)) { setText(""); return; }
    onChange([...value, trimmed]);
    setText("");
  };

  const removeChip = (chip) => onChange(value.filter(c => c !== chip));

  return (
    <div>
      {/* Existing chips */}
      {value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {value.map(chip => (
            <span key={chip} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 20, padding: "3px 10px",
              fontSize: 12, color: "#ef4444", fontWeight: 600
            }}>
              {chip}
              <button onClick={() => removeChip(chip)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#a78bfa", fontSize: 12, lineHeight: 1, padding: 0
              }}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ position: "relative" }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addChip(text); } }}
          placeholder={section.placeholder || `Type ${section.label} and press Enter`}
          style={{
            width: "100%", boxSizing: "border-box",
            border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 8,
            padding: "8px 12px", fontSize: 13, outline: "none",
            transition: "border-color 0.2s", color: "#fff",
            background: "rgba(255,255,255,0.05)"
          }}
          onFocus={e => e.target.style.borderColor = "rgba(239,68,68,0.6)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        {text.trim().length > 0 && (
          <button onClick={() => addChip(text)}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "#ef4444", border: "none", borderRadius: 5,
              padding: "2px 8px", fontSize: 10, color: "#fff",
              fontWeight: 700, cursor: "pointer"
            }}>Enter</button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {filtered_suggestions.length > 0 && (
        <div style={{
          marginTop: 4, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
          background: "#1a1a1a", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          maxHeight: 150, overflowY: "auto"
        }}>
          {filtered_suggestions.slice(0, 8).map(s => (
            <button key={s} onClick={() => addChip(s)} style={{
              width: "100%", padding: "7px 12px", textAlign: "left",
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "rgba(255,255,255,0.7)",
              borderBottom: "1px solid rgba(255,255,255,0.05)"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Multi-select checkboxes ───────────────────────────────────────
function MultiCheck({ section, value = [], onChange, data }) {
  let options = section.options || [];
  if (section.dynamic && data.length > 0) {
    const vals = [...new Set(data.map(d => d[section.dynamic]).filter(Boolean))].sort();
    options = vals;
  }
  if (options.length === 0) return <p style={{ fontSize: 12, color: "#9ca3af" }}>No options available</p>;

  const toggle = (opt) => {
    const v = typeof opt === "string" ? opt : opt.value;
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };

  const allSelected = options.length > 0 && options.every(o => {
    const v = typeof o === "string" ? o : o.value;
    return value.includes(v);
  });

  return (
    <div>
      {/* Select all */}
      <label style={{ display: "flex", alignItems: "center", gap: 10,
        padding: "4px 0 8px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", marginBottom: 6 }}>
        <CheckBox active={allSelected} onToggle={() => {
          if (allSelected) onChange([]);
          else onChange(options.map(o => typeof o === "string" ? o : o.value));
        }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>Select All</span>
      </label>

      {options.map(opt => {
        const v = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = value.includes(v);
        return (
          <label key={v} style={{ display: "flex", alignItems: "center", gap: 10,
            padding: "6px 0", cursor: "pointer" }}>
            <CheckBox active={active} onToggle={() => toggle(opt)} />
            <span style={{ fontSize: 13, color: active ? "#ef4444" : "rgba(255,255,255,0.6)",
              fontWeight: active ? 600 : 400 }}>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

// ── Single-select checkboxes (radio style) ────────────────────────
function SingleCheck({ section, value = "ALL", onChange, data }) {
  let options = section.options || [];
  if (section.dynamic && data.length > 0) {
    const vals = [...new Set(data.map(d => d[section.dynamic]).filter(Boolean))].sort();
    options = [{ value: "ALL", label: `All ${section.label}` }, ...vals.map(v => ({ value: v, label: v }))];
  }

  return (
    <div>
      {options.map(opt => {
        const v = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? (v === "ALL" ? `All ${section.label}` : v) : opt.label;
        const active = value === v;
        return (
          <label key={v} onClick={() => onChange(active ? "ALL" : v)}
            style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "6px 0", cursor: "pointer" }}>
            <CheckBox active={active} onToggle={() => onChange(active ? "ALL" : v)} />
            <span style={{ fontSize: 13, color: active ? "#ef4444" : "rgba(255,255,255,0.6)",
              fontWeight: active ? 600 : 400 }}>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

// ── Range select (dropdown style) ────────────────────────────────
function RangeSelect({ section, value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "8px 12px",
      border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 8,
      fontSize: 13, color: "#fff", background: "#1a1a1a",
      outline: "none", cursor: "pointer"
    }}>
      {(section.options || []).map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Checkbox widget ───────────────────────────────────────────────
function CheckBox({ active, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width: 17, height: 17, borderRadius: 5, flexShrink: 0,
      border: active ? "none" : "2px solid rgba(255,255,255,0.2)",
      background: active ? "#ef4444" : "rgba(255,255,255,0.05)",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "all 0.15s"
    }}>
      {active && (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════
export const TAB_CONFIGS = {

  // ── Users ────────────────────────────────────────────────────────
  users: {
    sections: [
      {
        key: "names", label: "Search by Name",
        type: "chips",
        placeholder: "Type name and press Enter",
      },
      {
        key: "emails", label: "Search by Email",
        type: "chips",
        placeholder: "Type email and press Enter",
        dynamic: "_emailDomain",
      },
      {
        key: "roles", label: "Role",
        type: "multi",
        options: [
          { value: "USER",        label: " User"        },
          { value: "MANAGER",     label: " Manager"     },
          { value: "ADMIN",       label: " Admin"       },
          { value: "SUPER_ADMIN", label: " Super Admin" },
        ],
      },
    ],
  },

  // ── Movies ───────────────────────────────────────────────────────
  movies: {
    sections: [
      {
        key: "titles", label: "Search by Title",
        type: "chips",
        placeholder: "Type title and press Enter",
      },
      {
        key: "genres", label: "Genre",
        type: "multi",
        options: ["Action","Comedy","Drama","Thriller","Horror","Romance",
                  "Sci-Fi","Animation","Documentary","Fantasy","Crime","Biography"],
      },
      {
        key: "languages", label: "Language",
        type: "multi",
        options: ["Tamil","Hindi","English","Telugu","Malayalam","Kannada","Bengali"],
      },
      {
        key: "formats", label: "Format",
        type: "multi",
        options: ["2D","3D","IMAX","4DX","IMAX 3D"],
      },
      {
        key: "duration", label: "Duration",
        type: "range",
        options: [
          { value: "ALL",    label: "Any Duration" },
          { value: "short",  label: "Under 2h"     },
          { value: "medium", label: "2h – 2h 30m"  },
          { value: "long",   label: "Over 2h 30m"  },
        ],
      },
    ],
  },

  // ── Show Timings ─────────────────────────────────────────────────
  shows: {
    sections: [
      {
        key: "movieSearch", label: "Search by Movie",
        type: "chips",
        placeholder: "Type movie name and press Enter",
        dynamic: "_movieTitle",
      },
      {
        key: "venueSearch", label: "Search by Venue",
        type: "chips",
        placeholder: "Type venue name and press Enter",
        dynamic: "_venueName",
      },
      {
        key: "dateRange", label: "Date",
        type: "single",
        options: [
          { value: "ALL",   label: "All Dates"   },
          { value: "today", label: "Today"        },
          { value: "week",  label: "This Week"    },
          { value: "month", label: "This Month"   },
        ],
      },
      {
        key: "timeSlot", label: "Time Slot",
        type: "multi",
        options: [
          { value: "morning",   label: "🌅 Morning (before 12)"  },
          { value: "afternoon", label: "☀️ Afternoon (12–17)"    },
          { value: "evening",   label: "🌆 Evening (17–20)"      },
          { value: "night",     label: "🌙 Night (after 20)"     },
        ],
      },
      {
        key: "priceRange", label: "Price",
        type: "range",
        options: [
          { value: "ALL",  label: "Any Price"   },
          { value: "low",  label: "Under ₹150"  },
          { value: "mid",  label: "₹150 – ₹300" },
          { value: "high", label: "Above ₹300"  },
        ],
      },
    ],
  },

  // ── Venues ───────────────────────────────────────────────────────
  venues: {
    sections: [
      {
        key: "nameSearch", label: "Search by Name",
        type: "chips",
        placeholder: "Type venue name and press Enter",
      },
      {
        key: "addressSearch", label: "Search by Area / Address",
        type: "chips",
        placeholder: "Type area or address and press Enter",
      },
      {
        key: "cities", label: "City",
        type: "multi",
        dynamic: "city",
        options: [],
      },
      {
        key: "seatCapacity", label: "Seat Capacity",
        type: "range",
        options: [
          { value: "ALL",    label: "Any Capacity" },
          { value: "small",  label: "Under 100"    },
          { value: "medium", label: "100 – 300"    },
          { value: "large",  label: "Over 300"     },
        ],
      },
    ],
  },

  // ── Approvals ────────────────────────────────────────────────────
  approvals: {
    sections: [
      {
        key: "userSearch", label: "Search by User",
        type: "chips",
        placeholder: "Type user name or email and press Enter",
      },
      {
        key: "types", label: "Request Type",
        type: "multi",
        options: [
          { value: "MOVIE", label: " Movie"  },
          { value: "VENUE", label: " Venue"  },
          { value: "USER",  label: " User"   },
        ],
      },
    ],
  },

  // ── Partner Requests ─────────────────────────────────────────────
  partners: {
    sections: [
      {
        key: "partnerSearch", label: "Search Partner",
        type: "chips",
        placeholder: "Type name, email or theatre and press Enter",
      },
      {
        key: "cities", label: "City",
        type: "multi",
        dynamic: "city",
        options: [],
      },
    ],
  },

  allbookings: {
    sections: [
      {
        key: "statuses", label: "Status",
        type: "multi",
        options: [
          { value: "CONFIRMED", label: "✅ Confirmed" },
          { value: "LOCKED",    label: "🔒 Locked"    },
          { value: "CANCELLED", label: "❌ Cancelled" },
          { value: "EXPIRED",   label: "⏰ Expired"   },
        ],
      },
      {
        key: "cities", label: "City",
        type: "multi",
        dynamic: "venueCity",
        options: [],
      },
    ],
  },

  overview: { sections: [] },
};

// ══════════════════════════════════════════════════════════════════
// applyFilters — apply filter state to a data array
// ══════════════════════════════════════════════════════════════════
export function applyFilters(data, tab, filters) {
  if (!data || !filters) return data;
  let result = [...data];

  const today    = new Date().toISOString().split("T")[0];
  const weekEnd  = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const monthEnd = new Date(
    new Date().getFullYear(), new Date().getMonth() + 1, 0
  ).toISOString().split("T")[0];

  const parseDuration = (s) => {
    if (!s) return 0;
    const h = parseInt(s.match(/(\d+)h/)?.[1] || 0);
    const m = parseInt(s.match(/(\d+)m/)?.[1] || 0);
    return h * 60 + m;
  };

  const matchChips = (chips, ...fields) => {
    if (!chips || chips.length === 0) return true;
    return chips.some(chip =>
      fields.some(f => f?.toLowerCase().includes(chip.toLowerCase()))
    );
  };

  for (const [key, val] of Object.entries(filters)) {
    const isEmpty = Array.isArray(val) ? val.length === 0 : (!val || val === "ALL");
    if (isEmpty) continue;

    switch (key) {

      // ── Users ──────────────────────────────────────────────────
      case "names":
        result = result.filter(u => matchChips(val, u.name));
        break;
      case "emails":
        result = result.filter(u => matchChips(val, u.email));
        break;
      case "roles":
        result = result.filter(u => {
          const r = (u.role ?? u.roles?.[0]?.name ?? u.roles?.[0] ?? "")
            .toString().toUpperCase().replace("ROLE_", "");
          return val.includes(r);
        });
        break;

      // ── Movies ─────────────────────────────────────────────────
      case "titles":
        result = result.filter(m => matchChips(val, m.title));
        break;
      case "genres":
        result = result.filter(m => val.includes(m.genre));
        break;
      case "languages":
        result = result.filter(m => val.includes(m.language));
        break;
      case "formats":
        result = result.filter(m => val.includes(m.format));
        break;
      case "duration": {
        result = result.filter(m => {
          const mins = parseDuration(m.duration);
          if (!mins) return true;
          if (val === "short")  return mins < 120;
          if (val === "medium") return mins >= 120 && mins <= 150;
          if (val === "long")   return mins > 150;
          return true;
        });
        break;
      }

      // ── Shows ──────────────────────────────────────────────────
      case "movieSearch":
        result = result.filter(s =>
          matchChips(val, s.movie?.title, s.movieTitle)
        );
        break;
      case "venueSearch":
        result = result.filter(s =>
          matchChips(val, s.venue?.name, s.venueName)
        );
        break;
      case "dateRange":
        if (val === "today")
          result = result.filter(s => s.showDate === today);
        else if (val === "week")
          result = result.filter(s => s.showDate >= today && s.showDate <= weekEnd);
        else if (val === "month")
          result = result.filter(s => s.showDate >= today && s.showDate <= monthEnd);
        break;
      case "timeSlot":
        result = result.filter(s => {
          const h = parseInt((s.showTime || "00:00").split(":")[0]);
          return val.some(slot => {
            if (slot === "morning")   return h < 12;
            if (slot === "afternoon") return h >= 12 && h < 17;
            if (slot === "evening")   return h >= 17 && h < 20;
            if (slot === "night")     return h >= 20;
            return false;
          });
        });
        break;
      case "priceRange": {
        result = result.filter(s => {
          const p = Number(s.price || 0);
          if (val === "low")  return p < 150;
          if (val === "mid")  return p >= 150 && p <= 300;
          if (val === "high") return p > 300;
          return true;
        });
        break;
      }

      // ── Venues ─────────────────────────────────────────────────
      case "nameSearch":
        result = result.filter(v => matchChips(val, v.name));
        break;
      case "addressSearch":
        result = result.filter(v => matchChips(val, v.area, v.address));
        break;
      case "seatCapacity": {
        result = result.filter(v => {
          const seats = Number(v.totalSeats || 0);
          if (val === "small")  return seats < 100;
          if (val === "medium") return seats >= 100 && seats <= 300;
          if (val === "large")  return seats > 300;
          return true;
        });
        break;
      }

      // ── Multi city (venues, partners, bookings) ─────────────────
      case "cities":
        result = result.filter(r =>
          val.includes(r.city || r.venueCity || "")
        );
        break;

      // ── Approvals ──────────────────────────────────────────────
      case "userSearch":
        result = result.filter(r =>
          matchChips(val, r.requestedByName, r.requestedByEmail)
        );
        break;
      case "types":
        result = result.filter(r => val.includes(r.type));
        break;

      // ── Partner search ─────────────────────────────────────────
      case "partnerSearch":
        result = result.filter(a =>
          matchChips(val, a.name, a.email, a.theatreName)
        );
        break;

      // ── Generic status / statuses ───────────────────────────────
      case "status":
        result = result.filter(r => r.status === val);
        break;
      case "statuses":
        result = result.filter(r => val.includes(r.status));
        break;
    }
  }
  return result;
}
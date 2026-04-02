import { useState, useMemo } from "react";

// ── Layout order: screen at bottom, seats fill upward ────────
// COUPLE (top/back) → GOLD → PREMIUM → STANDARD (front/screen)
const CAT_ORDER = ["REGULAR", "PREMIUM", "VIP", "COUPLE"];

const CATEGORY_CONFIG = {
  REGULAR: {
    label:      "Standard",
    icon:       "🪑",
    desc:       "Rows A–E · Closest to screen",
    sectionBg:  "bg-white/[0.02] border-white/[0.06]",
    tag:        "bg-white/10 text-white/40 border-white/10",
    multiplier: 1.0,
  },
  PREMIUM: {
    label:      "Premium",
    icon:       "⭐",
    desc:       "Rows F–I · Great view",
    sectionBg:  "bg-white/[0.02] border-white/[0.06]",
    tag:        "bg-violet-500/20 text-violet-300 border-violet-500/30",
    multiplier: 1.5,
  },
  VIP: {
    label:      "Gold",
    icon:       "👑",
    desc:       "Rows J–K · Premium experience",
    sectionBg:  "bg-white/[0.02] border-white/[0.06]",
    tag:        "bg-amber-500/20 text-amber-300 border-amber-500/30",
    multiplier: 2.0,
  },
  COUPLE: {
    label:      "Couple Den",
    icon:       "💑",
    desc:       "Rows L–M · Wide sofa seats · Auto-pairs · Best in house",
    sectionBg:  "bg-white/[0.02] border-white/[0.06]",
    tag:        "bg-rose-500/20 text-rose-300 border-rose-500/30",
    multiplier: 2.5,   // Most expensive — back rows, premium experience
    wide:       true,
  },
};

// ── Uniform seat colors across ALL categories ────────────────
const SEAT = {
  available: "bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-600 hover:border-zinc-400 hover:text-white",
  selected:  "bg-red-500  border-red-400  text-white shadow-lg shadow-red-500/40 scale-110",
  booked:    "bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed",
  locked:    "bg-yellow-900/40 border-yellow-700/40 text-yellow-700/50 cursor-not-allowed",
};

// ─────────────────────────────────────────────────────────────
// Single seat button
// ─────────────────────────────────────────────────────────────
function SeatBtn({ seat, isSelected, onToggle, currentUserId, basePrice }) {
  const cfg      = CATEGORY_CONFIG[seat.category] ?? CATEGORY_CONFIG.REGULAR;
  const isBooked = seat.booked;
  const isLocked = seat.locked && seat.lockedBy !== currentUserId;
  const isMine   = seat.locked && seat.lockedBy === currentUserId;
  const disabled = isBooked || isLocked;

  const cls = isBooked  ? SEAT.booked
            : isLocked  ? SEAT.locked
            : isSelected ? SEAT.selected
            :              SEAT.available;

  const price = Math.round(basePrice * cfg.multiplier);

  return (
    <button
      onClick={() => !disabled && onToggle(seat)}
      disabled={disabled}
      title={
        isBooked   ? `${seat.seatNumber} — Booked`
        : isLocked ? `${seat.seatNumber} — Locked`
        : isMine   ? `${seat.seatNumber} — Your pick`
        :            `${seat.seatNumber} — ₹${price}`
      }
      className={`
        relative flex items-center justify-center
        ${cfg.wide ? "w-14" : "w-9"} h-9
        rounded-lg border text-[10px] font-black
        transition-all duration-150 select-none shrink-0
        ${cls}
      `}
    >
      <span>{seat.seatNumber}</span>
      {cfg.wide && !disabled && (
        <span className="absolute bottom-0.5 right-1 text-[7px] opacity-30">♥</span>
      )}
      {isMine && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400
                         rounded-full ring-1 ring-black/50" />
      )}
      {isLocked && !isMine && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400
                         rounded-full ring-1 ring-black/50" />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// One row of seats — centred with aisle gap
// ─────────────────────────────────────────────────────────────
function SeatRow({ rowLabel, rowSeats, selectedSet, onToggle, currentUserId, basePrice }) {
  const half  = Math.ceil(rowSeats.length / 2);
  const left  = rowSeats.slice(0, half);
  const right = rowSeats.slice(half);

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="w-4 text-[10px] font-black text-white/15 text-right select-none shrink-0">
        {rowLabel}
      </span>

      <div className="flex gap-1">
        {left.map(s => (
          <SeatBtn key={s.seatId} seat={s}
            isSelected={selectedSet.has(s.seatId)}
            onToggle={onToggle} currentUserId={currentUserId} basePrice={basePrice} />
        ))}
      </div>

      {/* aisle */}
      <div className="w-5 shrink-0 flex justify-center">
        <div className="w-px h-5 bg-white/[0.08]" />
      </div>

      <div className="flex gap-1">
        {right.map(s => (
          <SeatBtn key={s.seatId} seat={s}
            isSelected={selectedSet.has(s.seatId)}
            onToggle={onToggle} currentUserId={currentUserId} basePrice={basePrice} />
        ))}
      </div>

      <span className="w-4 text-[10px] font-black text-white/15 select-none shrink-0">
        {rowLabel}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Category section with header
// ─────────────────────────────────────────────────────────────
function CategorySection({ category, rows, selectedSet, onToggle, currentUserId, basePrice }) {
  const cfg      = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.REGULAR;
  const allSeats = rows.flatMap(r => r.seats);
  const total    = allSeats.length;
  const booked   = allSeats.filter(s => s.booked).length;
  const avail    = total - booked;
  const price    = Math.round(basePrice * cfg.multiplier);

  return (
    <div className={`rounded-2xl border px-5 py-4 ${cfg.sectionBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{cfg.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-wide">{cfg.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.tag}`}>
                ₹{price}
              </span>
            </div>
            <p className="text-[10px] text-white/25 mt-0.5">{cfg.desc}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold text-white/40">{avail} / {total}</p>
          <p className="text-[9px] text-white/20 mt-0.5">available</p>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1.5 items-center">
        {rows.map(({ rowLabel, seats }) => (
          <SeatRow key={rowLabel}
            rowLabel={rowLabel} rowSeats={seats}
            selectedSet={selectedSet} onToggle={onToggle}
            currentUserId={currentUserId} basePrice={basePrice} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main SeatGrid
// ─────────────────────────────────────────────────────────────
export default function SeatGrid({ seats = [], currentUserId, onSelectionChange, basePrice = 100 }) {
  const [selectedSet, setSelectedSet] = useState(new Set());

  const handleToggle = (seat) => {
    setSelectedSet(prev => {
      const next = new Set(prev);

      if (next.has(seat.seatId)) {
        next.delete(seat.seatId);
        // de-pair couple
        if (seat.category === "COUPLE") {
          const partner = findCouplePartner(seats, seat);
          if (partner) next.delete(partner.seatId);
        }
      } else {
        next.add(seat.seatId);
        // auto-pair couple
        if (seat.category === "COUPLE") {
          const partner = findCouplePartner(seats, seat);
          if (partner && !partner.booked && !partner.locked) {
            next.add(partner.seatId);
          }
        }
      }

      onSelectionChange?.(seats.filter(s => next.has(s.seatId)));
      return next;
    });
  };

  // Group seats → { category → { rowLabel → seats[] } }
  const grouped = useMemo(() => {
    const map = {};
    for (const seat of seats) {
      const cat = seat.category ?? "REGULAR";
      const row = seat.rowLabel ?? (seat.seatNumber?.[0] ?? "A");
      if (!map[cat])      map[cat] = {};
      if (!map[cat][row]) map[cat][row] = [];
      map[cat][row].push(seat);
    }
    for (const cat of Object.keys(map)) {
      for (const row of Object.keys(map[cat])) {
        map[cat][row].sort((a, b) => {
          const na = parseInt(a.seatNumber?.replace(/\D/g, "") || 0);
          const nb = parseInt(b.seatNumber?.replace(/\D/g, "") || 0);
          return na - nb;
        });
      }
    }
    return map;
  }, [seats]);

  const selectedSeats = useMemo(() =>
    seats.filter(s => selectedSet.has(s.seatId)), [selectedSet, seats]);

  const totalPrice = useMemo(() =>
    selectedSeats.reduce((sum, s) => {
      const m = (CATEGORY_CONFIG[s.category] ?? CATEGORY_CONFIG.REGULAR).multiplier;
      return sum + Math.round(basePrice * m);
    }, 0),
    [selectedSeats, basePrice]
  );

  return (
    <div className="w-full">

      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-4 py-2.5
                        bg-white/[0.04] rounded-xl border border-white/[0.08] gap-3">
          <div className="flex gap-1.5 flex-wrap min-w-0">
            {selectedSeats.map(s => {
              const cfg = CATEGORY_CONFIG[s.category] ?? CATEGORY_CONFIG.REGULAR;
              return (
                <span key={s.seatId}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.tag}`}>
                  {s.seatNumber}
                </span>
              );
            })}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Total</p>
            <p className="text-white font-black text-base leading-none">₹{totalPrice.toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-5">
        {[
          { label: "Available", cls: `${SEAT.available} w-5 h-5` },
          { label: "Selected",  cls: `${SEAT.selected}  w-5 h-5` },
          { label: "Booked",    cls: `${SEAT.booked}    w-5 h-5` },
          { label: "Locked",    cls: `${SEAT.locked}    w-5 h-5` },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`rounded-md border ${cls}`} />
            <span className="text-white/30 text-[11px] font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Seat grid — Screen at top, Couple Den at bottom */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-max mx-auto space-y-2">

          {/* ── SCREEN ── */}
          <div className="flex flex-col items-center pb-2 mb-1">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
              ▼ Screen ▼
            </p>
            <div className="w-3/4 h-1.5 bg-gradient-to-r from-transparent via-red-500/60 to-transparent rounded-full" />
          </div>

          {CAT_ORDER.map(cat => {
            const rowMap = grouped[cat];
            if (!rowMap) return null;

            const rows = Object.entries(rowMap)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([rowLabel, seatList]) => ({ rowLabel, seats: seatList }));

            return (
              <CategorySection key={cat} category={cat} rows={rows}
                selectedSet={selectedSet} onToggle={handleToggle}
                currentUserId={currentUserId} basePrice={basePrice} />
            );
          })}


        </div>
      </div>
    </div>
  );
}

// ── Find couple partner seat ─────────────────────────────────
function findCouplePartner(allSeats, seat) {
  const num     = parseInt(seat.seatNumber?.replace(/\D/g, "") || 0);
  const partner = num % 2 === 1 ? num + 1 : num - 1;
  return allSeats.find(
    s => s.category === "COUPLE" &&
         s.rowLabel === seat.rowLabel &&
         parseInt(s.seatNumber?.replace(/\D/g, "") || 0) === partner
  ) ?? null;
}
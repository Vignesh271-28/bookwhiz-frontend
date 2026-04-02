// ── Pagination.jsx ────────────────────────────────────────────
// Drop in: src/components/Pagination.jsx
//
// Props:
//   total     – total item count (after filtering)
//   page      – current page, 1-based
//   perPage   – items per page
//   onPage    – (n) => void
//   onPerPage – (n) => void   (also reset page to 1 from parent)

export default function Pagination({ total = 0, page = 1, perPage = 10, onPage, onPerPage }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Build page number list with ellipsis
  const getPages = () => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)              return [1, 2, 3, "...", totalPages];
    if (page >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  const start = total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total);
  const end   = Math.min(page * perPage, total);

  // Always render — never return null
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between
                    gap-4 pt-4 mt-4 border-t border-white/[0.06]">

      {/* Results label */}
      <p className="text-white/30 text-sm font-medium order-2 sm:order-1">
        {total === 0
          ? <span className="text-white/20 italic">No results</span>
          : <>
              {" "}
              <span className="text-white/60 font-bold">{start}–{end}</span>
              {" "}of{" "}
              <span className="text-white/60 font-bold">{total}</span>
            </>
        }
      </p>

      <div className="flex items-center gap-2 order-1 sm:order-2">

        {/* Page buttons — only when more than 1 page */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => onPage(page - 1)} disabled={page === 1}    label="‹" />

            {getPages().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`}
                  className="w-10 h-10 flex items-center justify-center
                             text-white/20 text-xs font-bold rounded-xl
                             bg-white/[0.03] border border-white/[0.05]">
                  ···
                </span>
              ) : (
                <PageBtn key={p} onClick={() => onPage(p)} active={p === page} label={p} />
              )
            )}

            <PageBtn onClick={() => onPage(page + 1)} disabled={page === totalPages} label="›" />
          </div>
        )}

        {/* Per-page selector — always visible */}
        <div className="relative">
          <select
            value={perPage}
            onChange={e => onPerPage(Number(e.target.value))}
            className="appearance-none pl-4 pr-8 py-2.5 rounded-xl text-sm font-bold
                       text-white bg-white/[0.06] border border-white/[0.08]
                       cursor-pointer focus:outline-none focus:ring-2
                       focus:ring-red-500/30 focus:border-red-500/40
                       hover:bg-white/[0.09] transition-all">
            {[5, 10, 20, 50].map(n => (
              <option key={n} value={n} className="bg-gray-950 text-white">
                {n} 
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2
                           -translate-y-1/2 text-red-400/70 text-xs">▾</span>
        </div>
      </div>
    </div>
  );
}

function PageBtn({ onClick, disabled, active, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-10 h-10 rounded-xl text-sm font-black flex items-center justify-center",
        "border transition-all duration-150 select-none",
        active
          ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20 scale-105"
          : disabled
            ? "bg-white/[0.02] text-white/10 border-white/[0.04] cursor-not-allowed"
            : "bg-white/[0.04] text-white/40 border-white/[0.07] cursor-pointer hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25"
      ].join(" ")}>
      {label}
    </button>
  );
}
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";

// ── Standalone snackbar UI — defined OUTSIDE the hook so React
//    never unmounts/remounts it on state changes ──────────────────
function SnackbarUI({ message, progress, onUndo, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      minWidth: 320, maxWidth: 480,
      fontFamily: "DM Sans, system-ui, sans-serif",
    }}>
      <div style={{
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(239,68,68,0.1)",
        overflow: "hidden",
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #ef4444, #f97316)",
            borderRadius: 3,
            transition: "width 0.05s linear",
          }} />
        </div>

        {/* Content */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "14px 16px", gap: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>🗑️</div>

          <span style={{
            flex: 1, fontSize: 13, fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
          }}>{message}</span>

          {onUndo && (
            <button onClick={onUndo} style={{
              padding: "6px 14px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 8, cursor: "pointer",
              fontSize: 12, fontWeight: 800,
              color: "#ef4444", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}>
              ↩ Undo
            </button>
          )}

          <button onClick={onDismiss} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.25)", fontSize: 16, lineHeight: 1,
            padding: 4, borderRadius: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}>
            ✕
          </button>
        </div>
      </div>

      <style>{`
        @keyframes snackSlideUp {
          from { opacity:0; transform: translateX(-50%) translateY(16px); }
          to   { opacity:1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Hook ──────────────────────────────────────────────────────────
export function useUndoSnackbar() {
  const [snack,    setSnack]    = useState(null);
  const [progress, setProgress] = useState(100);
  const timerRef    = useRef(null);
  const intervalRef = useRef(null);
  const startRef    = useRef(null);
  const DURATION    = 4000;

  const clearAll = () => {
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
  };

  const showSnackbar = useCallback(({ message, onUndo, onCommit }) => {
    // Commit any existing pending action immediately before showing new
    setSnack(prev => { if (prev?.onCommit) prev.onCommit(); return null; });
    clearAll();

    startRef.current = Date.now();
    setSnack({ message, onUndo, onCommit });
    setProgress(100);

    // Smooth progress countdown — update every 80ms (less frequent = no flicker)
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
    }, 80);

    // Commit after DURATION
    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      onCommit?.();
      setSnack(null);
      setProgress(100);
    }, DURATION);
  }, []);

  const handleUndo = useCallback(() => {
    clearAll();
    setSnack(prev => {
      if (prev?.onUndo) {
        prev.onUndo();
        // Show toast after undo
        toast.success("↩ Action undone");
      }
      return null;
    });
    setProgress(100);
  }, []);

  const handleDismiss = useCallback(() => {
    clearAll();
    setSnack(prev => { prev?.onCommit?.(); return null; });
    setProgress(100);
  }, []);

  useEffect(() => () => clearAll(), []);

  // SnackbarPortal — stable reference, no remount on progress change
  const SnackbarPortal = useCallback(() => (
    <SnackbarUI
      message={snack?.message ?? null}
      progress={progress}
      onUndo={snack?.onUndo ? handleUndo : null}
      onDismiss={handleDismiss}
    />
  ), [snack, progress, handleUndo, handleDismiss]);

  return { showSnackbar, SnackbarPortal };
}
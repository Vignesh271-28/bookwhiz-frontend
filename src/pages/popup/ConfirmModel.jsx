
export default function ConfirmModal({
    open,
    title       = "Are you sure?",
    message     = "This action cannot be undone.",
    confirmLabel = "Confirm",
    cancelLabel  = "Cancel",
    variant     = "danger",
    onConfirm,
    onCancel,
  }) {
    if (!open) return null;
  
    const VARIANTS = {
      danger:  { icon: "", btn: "bg-red-500 hover:bg-red-600",      ring: "border-red-500/20",  text: "text-red-400"   },
      success: { icon: "", btn: "bg-green-500 hover:bg-green-600",   ring: "border-green-500/20",text: "text-green-400" },
      warning: { icon: "", btn: "bg-yellow-500 hover:bg-yellow-600", ring: "border-yellow-500/20",text:"text-yellow-400"},
    };
    const v = VARIANTS[variant] ?? VARIANTS.danger;
  
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center
                   bg-black/75 backdrop-blur-sm px-4"
        onClick={onCancel}>
  
        <div
          onClick={e => e.stopPropagation()}
          className={`bg-gray-950 border ${v.ring} rounded-2xl p-6
                      w-full max-w-xl shadow-2xl space-y-5
                      animate-[fadeIn_0.15s_ease]`}>
  
          {/* Icon + title */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{v.icon}</span>
            <div>
              <h3 className="text-white font-black text-base">{title}</h3>
              <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{message}</p>
            </div>
          </div>
  
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold
                         text-white/40 border border-white/10
                         hover:text-white/70 hover:border-white/20 transition">
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black
                          text-white transition ${v.btn}`}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }
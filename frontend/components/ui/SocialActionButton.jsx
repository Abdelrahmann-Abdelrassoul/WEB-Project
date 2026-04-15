"use client";

export default function SocialActionButton({
  icon: Icon,
  label,
  count = null,
  active = false,
  pending = false,
  onClick,
  className = "",
  iconClassName = "",
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
        active
          ? "border-purple-400/40 bg-purple-500/10 text-white"
          : "border-white/15 bg-white/5 text-gray-200 hover:bg-white/10"
      } ${(disabled || pending) ? "cursor-not-allowed opacity-60" : ""} ${className}`}
    >
      {Icon ? <Icon size={16} className={iconClassName} /> : null}
      <span>{label}</span>
      {count !== null ? (
        <span className="rounded-full bg-black/25 px-2 py-0.5 text-xs text-white/80">
          {count}
        </span>
      ) : null}
    </button>
  );
}

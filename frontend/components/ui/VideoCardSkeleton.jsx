export default function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="aspect-video bg-white/10" />

      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 w-3/4 rounded-lg bg-white/10" />
        {/* Username */}
        <div className="h-3.5 w-1/3 rounded-lg bg-white/10" />
        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-lg bg-white/10" />
          <div className="h-3 w-2/3 rounded-lg bg-white/10" />
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="h-9 rounded-xl bg-white/10" />
          <div className="h-9 rounded-xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}
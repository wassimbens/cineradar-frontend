export function FilmCardSkeleton() {
  return (
    <div className="card" style={{ borderRadius: 10, overflow: "hidden" }}>
      <div className="skeleton w-full" style={{ aspectRatio: "2/3" }} />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-4 rounded" style={{ width: "85%" }} />
        <div className="skeleton h-3 rounded" style={{ width: "55%" }} />
        <div className="skeleton h-3 rounded" style={{ width: "40%" }} />
      </div>
    </div>
  );
}

export function CinemaCardSkeleton() {
  return (
    <div className="card p-4" style={{ borderRadius: 10 }}>
      <div className="flex items-start gap-3">
        <div className="skeleton w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 rounded" style={{ width: "70%" }} />
          <div className="skeleton h-3 rounded" style={{ width: "50%" }} />
          <div className="skeleton h-3 rounded" style={{ width: "80%" }} />
        </div>
      </div>
    </div>
  );
}

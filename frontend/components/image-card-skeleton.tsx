export function ImageCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-navy">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="h-9 w-9 rounded-full bg-navy-light" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-24 rounded bg-navy-light" />
          <div className="h-3 w-16 rounded bg-navy-light" />
        </div>
      </div>
      {/* Image skeleton */}
      <div className="aspect-square w-full bg-navy-light" />
      {/* Footer skeleton */}
      <div className="space-y-3 px-5 py-4">
        <div className="flex gap-4">
          <div className="h-5 w-5 rounded bg-navy-light" />
          <div className="h-5 w-5 rounded bg-navy-light" />
        </div>
        <div className="h-4 w-3/4 rounded bg-navy-light" />
        <div className="h-3.5 w-1/2 rounded bg-navy-light" />
      </div>
    </div>
  );
}

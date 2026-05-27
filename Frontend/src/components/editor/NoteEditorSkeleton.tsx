import { Skeleton } from '../ui/skeleton';

/**
 * Mirrors the exact layout of NoteEditor so the transition feels seamless.
 * Shown only while getById() is in-flight (note open / note switch).
 * Never shown during debounced auto-saves.
 */
export function NoteEditorSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden animate-in fade-in duration-150">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pt-5 pb-0">

        {/* Category badge row */}
        <div className="flex items-center gap-2 h-[22px] mb-2.5">
          <Skeleton className="h-[18px] w-24 rounded-full" />
        </div>

        {/* Title */}
        <Skeleton className="h-8 w-2/3 rounded-lg mt-1 mb-1" />

        {/* Timestamps + action buttons row */}
        <div className="flex items-center justify-between py-2 gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-3.5 w-28 rounded hidden sm:block" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ── Editor body ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 lg:py-8 space-y-3">

          {/* Paragraph lines — vary widths for a natural look */}
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-[92%] rounded" />
          <Skeleton className="h-4 w-[78%] rounded" />

          <div className="pt-2" />

          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-[85%] rounded" />
          <Skeleton className="h-4 w-[60%] rounded" />

          <div className="pt-2" />

          {/* A "heading"-sized block */}
          <Skeleton className="h-6 w-[45%] rounded" />

          <div className="pt-1" />

          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-[88%] rounded" />
          <Skeleton className="h-4 w-[70%] rounded" />
          <Skeleton className="h-4 w-[50%] rounded" />

          <div className="pt-2" />

          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-[75%] rounded" />
        </div>
      </div>
    </div>
  );
}

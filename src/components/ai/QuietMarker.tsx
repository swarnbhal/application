import { cn } from "@/lib/utils"

export function QuietMarker({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-[0.35em] inline-block h-3 w-px shrink-0 bg-zinc-400",
        className,
      )}
    />
  )
}

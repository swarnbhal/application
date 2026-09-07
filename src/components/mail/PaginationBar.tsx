import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PageSize } from "@/store/slices/filters-slice"

interface PaginationBarProps {
  fromIndex: number
  toIndex: number
  total: number
  page: number
  pageSize: PageSize | number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: PageSize) => void
}

const SIZES: PageSize[] = [10, 25, 50]

export function PaginationBar({
  fromIndex,
  toIndex,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card/60 px-4 py-2.5 text-xs text-muted-foreground">
      <p>
        {total === 0
          ? "Showing 0 of 0"
          : `Showing ${fromIndex}–${toIndex} of ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-3">
          {onPageSizeChange ? (
            <div className="flex items-center gap-1.5" role="group" aria-label="Per page">
              <span className="tracking-[0.14em] uppercase">Per page</span>
              {SIZES.map((size) => (
                <Button
                  key={size}
                  type="button"
                  size="xs"
                  variant={pageSize === size ? "secondary" : "ghost"}
                  aria-pressed={pageSize === size}
                  aria-label={`${size} per page`}
                  onClick={() => onPageSizeChange(size)}
                  className={cn(pageSize === size && "font-semibold")}
                >
                  {size}
                </Button>
              ))}
            </div>
          ) : null}
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            aria-label="Previous page"
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= lastPage}
            aria-label="Next page"
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

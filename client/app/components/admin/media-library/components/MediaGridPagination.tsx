import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { useMediaLibrary } from "../MediaLibraryContextEnhanced";

interface MediaGridPaginationProps {
  totalPages: number;
  totalAssets: number;
  displayCount: number;
}

export const MediaGridPagination = React.memo(
  ({ totalPages, totalAssets, displayCount }: MediaGridPaginationProps) => {
    const { state, setCurrentPage } = useMediaLibrary();

    if (totalPages <= 1) {
      if (displayCount > 0) {
        return (
          <div className="text-admin-muted border-t border-white/5 py-4 text-center text-sm">
            {displayCount} media {displayCount === 1 ? "item" : "items"}
          </div>
        );
      }
      return null;
    }

    return (
      <div
        className="flex items-center justify-between border-t border-white/5 px-4 py-6"
        data-testid="pagination-controls"
      >
        <div className="text-admin-muted text-sm">
          Showing {displayCount} of {totalAssets} media items
        </div>

        <div className="flex items-center gap-2">
          {/* Previous Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, state.currentPage - 1))}
            disabled={state.currentPage <= 1}
            className="flex items-center gap-1 border-white/10 bg-white/5 text-admin-foreground hover:bg-white/10 hover:text-white disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum = 0;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (state.currentPage <= 3) {
                pageNum = i + 1;
              } else if (state.currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = state.currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === state.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="h-8 min-w-8"
                >
                  {pageNum}
                </Button>
              );
            })}

            {totalPages > 5 && state.currentPage < totalPages - 2 && (
              <>
                <span className="text-admin-muted px-2">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="h-8 min-w-8"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          {/* Next Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, state.currentPage + 1))}
            disabled={state.currentPage >= totalPages}
            className="flex items-center gap-1 border-white/10 bg-white/5 text-admin-foreground hover:bg-white/10 hover:text-white disabled:opacity-50 transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  },
);

MediaGridPagination.displayName = "MediaGridPagination";

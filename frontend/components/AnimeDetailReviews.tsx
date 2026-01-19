"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ReviewCard from "@/components/ReviewCard"
import { LoadingSpinner } from "@/components/loading"
import { EmptyState } from "@/components/DataLoadingStates"
import { Button } from "@/components/ui/button"

interface AnimeDetailReviewsProps {
  reviews: string[]
  reviewsPerPage?: number
  isLoading?: boolean
  variant?: "section" | "tab"
  className?: string
}

export default function AnimeDetailReviews({
  reviews,
  reviewsPerPage = 3,
  isLoading = false,
  variant = "section",
  className,
}: AnimeDetailReviewsProps) {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const isTabVariant = variant === "tab"

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * reviewsPerPage
    const endIndex = startIndex + reviewsPerPage
    return reviews.slice(startIndex, endIndex)
  }, [reviews, currentPage, reviewsPerPage])

  const totalPages = Math.ceil(reviews.length / reviewsPerPage)

  const containerClassName = [
    isTabVariant ? "space-y-4" : "space-y-6",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  const Wrapper = isTabVariant ? "div" : "section"
  const wrapperProps = isTabVariant
    ? {}
    : {
        id: "reviews",
        role: "status",
        "aria-live": "polite",
        "aria-busy": isLoading,
      }

  return (
    <Wrapper className={containerClassName} {...wrapperProps}>
      {!isTabVariant && (
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Reviews
            {reviews.length > 0 && (
              <span className="ml-3 text-base font-normal text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            What fans are saying about this anime.
          </p>
        </div>
      )}
      {isTabVariant && reviews.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" message="Loading reviews..." />
        </div>
      ) : reviews.length ? (
        <>
          <div className={`grid ${isTabVariant ? "gap-4" : "gap-5"}`}>
            {paginatedReviews.map((review, index) => (
              <ReviewCard
                key={`review-${(currentPage - 1) * reviewsPerPage + index}`}
                review={review}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div
              className={`flex items-center justify-between gap-4 ${
                isTabVariant ? "pt-1" : "pt-2"
              }`}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="gap-1.5"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          message="Be the first to share your thoughts on this title."
          title="No reviews available"
        />
      )}
    </Wrapper>
  )
}

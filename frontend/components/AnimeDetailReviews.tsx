"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ReviewCard from "@/components/ReviewCard"
import SectionHeader from "@/components/SectionHeader"
import { EmptyState } from "@/components/DataLoadingStates"
import { Button } from "@/components/ui/button"

interface AnimeDetailReviewsProps {
  reviews: string[]
  reviewsPerPage?: number
}

export default function AnimeDetailReviews({
  reviews,
  reviewsPerPage = 3,
}: AnimeDetailReviewsProps) {
  const [currentPage, setCurrentPage] = useState<number>(1)

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * reviewsPerPage
    const endIndex = startIndex + reviewsPerPage
    return reviews.slice(startIndex, endIndex)
  }, [reviews, currentPage, reviewsPerPage])

  const totalPages = Math.ceil(reviews.length / reviewsPerPage)

  return (
    <section className="space-y-6" id="reviews">
      <SectionHeader
        title={
          <>
            Reviews
            {reviews.length > 0 && (
              <span className="ml-3 text-base font-normal text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </>
        }
        description="What fans are saying about this anime."
      />
      {reviews.length ? (
        <>
          <div className="grid gap-5">
            {paginatedReviews.map((review, index) => (
              <ReviewCard
                key={`review-${(currentPage - 1) * reviewsPerPage + index}`}
                review={review}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
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
    </section>
  )
}

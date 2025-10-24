"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react"

interface ReviewCardProps {
  review: string
}

const CHARACTER_LIMIT = 500

export default function ReviewCard({ review }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = review.length > CHARACTER_LIMIT

  // Format the review text to add proper paragraph spacing
  const formatReview = (text: string) => {
    return text
      .split('\n')
      .filter(line => line.trim()) // Remove empty lines
      .join('\n\n') // Add double spacing between paragraphs
  }

  const formattedReview = formatReview(review)
  const displayText = isExpanded || !shouldTruncate
    ? formattedReview
    : `${formattedReview.slice(0, CHARACTER_LIMIT)}...`

  return (
    <Card className="group relative overflow-hidden border border-border/60 bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/70 hover:shadow-md">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />

      <CardContent className="px-4 py-5 pl-6 sm:px-6 sm:py-6 sm:pl-8">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-1 h-5 w-5 shrink-0 text-primary/60" />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="whitespace-pre-line text-base leading-7 text-foreground/90">
                {displayText}
              </p>
            </div>
          </div>

          {shouldTruncate && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="group/btn gap-1.5 text-sm font-medium text-primary/80 hover:bg-primary/10 hover:text-primary"
              >
                {isExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5" />
                  </>
                ) : (
                  <>
                    Read more
                    <ChevronDown className="h-4 w-4 transition-transform group-hover/btn:translate-y-0.5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

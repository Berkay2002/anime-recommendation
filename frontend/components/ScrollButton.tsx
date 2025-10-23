import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

interface ScrollButtonProps {
  direction: "left" | "right"
  onClick: () => void
  show: boolean
}

const iconByDirection = {
  left: <ChevronLeft className="size-4" aria-hidden="true" />,
  right: <ChevronRight className="size-4" aria-hidden="true" />,
}

const ScrollButton: React.FC<ScrollButtonProps> = ({
  direction,
  onClick,
  show,
}) => {
  if (!show) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 rounded-full border border-border/60 bg-background/80 shadow-md backdrop-blur transition-all hover:bg-accent hover:text-accent-foreground",
        direction === "left" ? "-left-2 md:-left-3" : "-right-2 md:-right-3"
      )}
    >
      {iconByDirection[direction]}
    </Button>
  )
}

export default ScrollButton

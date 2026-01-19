"use client"

import { X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  progress?: number
  message: string
  onCancel?: () => void
  className?: string
}

export function ProgressBar({
  progress,
  message,
  onCancel,
  className,
}: ProgressBarProps) {
  const isIndeterminate = progress === undefined

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isIndeterminate}
      className={cn("space-y-2", className)}
    >
      <Progress value={progress} className="h-2" />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground flex-1">{message}</p>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="shrink-0 gap-1.5 h-8 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </Button>
        )}
      </div>
    </div>
  )
}

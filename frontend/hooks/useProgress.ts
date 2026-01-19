import { useState } from "react"

interface UseProgressState {
  progress: number | undefined
  message: string
  isGenerating: boolean
}

interface UseProgressActions {
  startProgress: (initialMessage?: string) => void
  updateProgress: (value: number) => void
  setStep: (message: string) => void
  finishProgress: () => void
  cancel: () => void
}

export function useProgress(): UseProgressState & UseProgressActions {
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const [message, setMessage] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  const startProgress = (initialMessage: string = "Starting...") => {
    setIsGenerating(true)
    setProgress(undefined)
    setMessage(initialMessage)
  }

  const updateProgress = (value: number) => {
    setProgress(Math.min(100, Math.max(0, value)))
  }

  const setStep = (stepMessage: string) => {
    setMessage(stepMessage)
  }

  const finishProgress = () => {
    setIsGenerating(false)
    setProgress(undefined)
    setMessage("")
  }

  const cancel = () => {
    setIsGenerating(false)
    setProgress(undefined)
    setMessage("")
  }

  return {
    progress,
    message,
    isGenerating,
    startProgress,
    updateProgress,
    setStep,
    finishProgress,
    cancel,
  }
}

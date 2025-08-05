"use client"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Clock, Loader2, CheckCircle, AlertCircle, X } from "lucide-react"

interface ProgressMonitorProps {
  id: string
  variant: "section" | "overall" | "realtime"
  title: string
  progress: number // 0-100
  state: "queued" | "processing" | "complete" | "error"
  currentOperation?: string
  estimatedTimeRemaining?: number // seconds
  elapsedTime?: number // seconds
  completedAt?: Date
  error?: string
  onCancel?: (id: string) => void
  onRetry?: (id: string) => void
  size?: "sm" | "md" | "lg"
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return ""
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

const stateStyles = {
  queued: {
    progress: "bg-muted",
    icon: "text-muted-foreground",
    text: "text-muted-foreground",
  },
  processing: {
    progress: "bg-primary",
    icon: "text-primary",
    text: "text-foreground",
  },
  complete: {
    progress: "bg-green-500",
    icon: "text-green-600",
    text: "text-green-700",
  },
  error: {
    progress: "bg-destructive",
    icon: "text-destructive",
    text: "text-destructive",
  },
}

const StateIcon = ({ state, className }: { state: ProgressMonitorProps["state"]; className?: string }) => {
  const styles = stateStyles[state]
  switch (state) {
    case "queued":
      return <Clock className={cn(styles.icon, className)} />
    case "processing":
      return <Loader2 className={cn(styles.icon, "animate-spin", className)} />
    case "complete":
      return <CheckCircle className={cn(styles.icon, className)} />
    case "error":
      return <AlertCircle className={cn(styles.icon, className)} />
    default:
      return null
  }
}

export function ProgressMonitor({
  id,
  variant,
  title,
  progress,
  state,
  currentOperation,
  estimatedTimeRemaining,
  elapsedTime,
  completedAt,
  error,
  onCancel,
  onRetry,
  size = "md",
}: ProgressMonitorProps) {
  const styles = stateStyles[state]

  if (variant === "realtime") {
    return (
      <div className="flex items-center gap-2" aria-live="polite">
        <StateIcon state={state} className="h-4 w-4" />
        <span className={cn("text-sm", styles.text)}>{currentOperation || title}</span>
      </div>
    )
  }

  const renderHeader = () => (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <StateIcon state={state} className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
        <h3 className={cn("font-semibold", styles.text, size === "sm" ? "text-sm" : "text-md")}>{title}</h3>
      </div>
      {(state === "processing" || state === "queued") && onCancel && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => onCancel(id)}
          aria-label="Cancel process"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )

  const renderFooter = () => (
    <div
      className={cn("flex items-center justify-between text-xs", styles.text, size === "sm" ? "text-xs" : "text-sm")}
    >
      <div aria-live="polite">
        {state === "processing" && currentOperation && <p>{currentOperation}</p>}
        {state === "complete" && (
          <p>Completed at {completedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        )}
        {state === "error" && <p>{error || "An unknown error occurred."}</p>}
      </div>
      <div className="text-right">
        {state === "processing" && estimatedTimeRemaining !== undefined && (
          <p>{formatTime(estimatedTimeRemaining)} left</p>
        )}
        {state === "processing" && elapsedTime !== undefined && (
          <p className="text-muted-foreground text-xs">{formatTime(elapsedTime)} elapsed</p>
        )}
        {state === "error" && onRetry && (
          <Button variant="link" size="sm" onClick={() => onRetry(id)} className={cn("h-auto p-0", styles.text)}>
            Retry
          </Button>
        )}
      </div>
    </div>
  )

  if (variant === "section") {
    return (
      <div className={cn("space-y-1.5", size === "sm" ? "p-2" : "p-3")}>
        {renderHeader()}
        <Progress value={progress} className={cn("h-1.5", styles.progress)} />
        {renderFooter()}
      </div>
    )
  }

  if (variant === "overall") {
    return (
      <div
        className={cn(
          "space-y-3 rounded-lg border bg-card p-4",
          state === "error" ? "border-destructive/50" : "border-border",
        )}
      >
        {renderHeader()}
        <div>
          <Progress value={progress} className={cn("h-2", styles.progress)} />
          <div className="mt-1 flex justify-end">
            <span className={cn("font-mono text-sm font-medium", styles.text)}>{Math.round(progress)}%</span>
          </div>
        </div>
        {renderFooter()}
      </div>
    )
  }

  return null
}

"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BotMessageSquare, ChevronDown } from "lucide-react"

interface AIInteractionCalloutProps {
  id: string
  variant: "question" | "information" | "warning"
  message: string
  timestamp: Date
  state: "active" | "answered" | "dismissed"
  answer?: string
  answerTimestamp?: Date
  onAnswer?: (id: string, answer: string) => void
  onDismiss?: (id: string) => void
  onExpand?: (id: string) => void
}

const variantStyles = {
  question: {
    border: "border-amber-200",
    background: "bg-amber-50/80",
    text: "text-amber-900",
    darkBorder: "dark:border-amber-800/50",
    darkBackground: "dark:bg-amber-950",
    darkText: "dark:text-amber-200",
  },
  information: {
    border: "border-blue-200",
    background: "bg-blue-50/80",
    text: "text-blue-900",
    darkBorder: "dark:border-blue-800/50",
    darkBackground: "dark:bg-blue-950",
    darkText: "dark:text-blue-200",
  },
  warning: {
    border: "border-orange-200",
    background: "bg-orange-50/80",
    text: "text-orange-900",
    darkBorder: "dark:border-orange-800/50",
    darkBackground: "dark:bg-orange-950",
    darkText: "dark:text-orange-200",
  },
}

const formatTimestamp = (date: Date) => {
  // Use a consistent format to avoid hydration mismatches
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const truncate = (str: string, len: number) => {
  return str.length > len ? str.substring(0, len) + "..." : str
}

export function AIInteractionCallout({
  id,
  variant,
  message,
  timestamp,
  state,
  answer,
  answerTimestamp,
  onAnswer,
  onDismiss,
  onExpand,
}: AIInteractionCalloutProps) {
  const [isOpen, setIsOpen] = useState(state === "active")
  const [responseText, setResponseText] = useState("")

  if (state === "dismissed") {
    return null
  }

  const styles = variantStyles[variant]

  const handleAnswerSubmit = () => {
    if (onAnswer && responseText.trim()) {
      onAnswer(id, responseText.trim())
      setIsOpen(false)
    }
  }

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(id)
    }
  }

  const handleToggle = (open: boolean) => {
    setIsOpen(open)
    if (open && onExpand) {
      onExpand(id)
    }
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleToggle}
      className={cn(
        "rounded-lg border p-3 transition-all",
        styles.border,
        styles.background,
        styles.text,
        styles.darkBorder,
        styles.darkBackground,
        styles.darkText,
      )}
    >
      <CollapsibleTrigger asChild>
        <div className="flex w-full cursor-pointer items-start gap-3" role="button">
          <BotMessageSquare className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-left">
            {isOpen ? (
              <p className="font-semibold">{variant.charAt(0).toUpperCase() + variant.slice(1)} from AI</p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold leading-tight">{truncate(message, 80)}</p>
                {state === "answered" && answer && (
                  <p className="text-xs opacity-80">
                    <span className="font-semibold">Your reply:</span> {truncate(answer, 60)}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatTimestamp(timestamp)}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 border-t border-current/20 pt-3">
        <p className="whitespace-pre-wrap text-sm">{message}</p>
        {state === "active" && (
          <div className="mt-4 space-y-3">
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your response here..."
              className="bg-background/50 text-foreground dark:bg-card/50"
              aria-label="Response to AI question"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Dismiss
              </Button>
              <Button size="sm" onClick={handleAnswerSubmit} disabled={!responseText.trim()}>
                Submit Answer
              </Button>
            </div>
          </div>
        )}
        {state === "answered" && answer && (
          <div className="mt-4 border-t border-dashed border-current/30 pt-3">
            <p className="text-sm font-semibold">
              Your Answer{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({answerTimestamp && formatTimestamp(answerTimestamp)})
              </span>
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm opacity-90">{answer}</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

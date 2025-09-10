import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function calculateNextReview(
  easeFactor: number,
  interval: number,
  quality: number
): { easeFactor: number; interval: number; nextReview: Date } {
  // SM-2 algorithm implementation
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3
  }

  let newInterval: number
  if (quality < 3) {
    newInterval = 1
  } else {
    if (interval === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEaseFactor)
    }
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReview,
  }
}
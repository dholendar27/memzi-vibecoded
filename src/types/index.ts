import { CardStatus, Difficulty } from '@prisma/client'

export { CardStatus, Difficulty }

export interface User {
  id: string
  name?: string
  email: string
  image?: string
}

export interface Deck {
  id: string
  name: string
  description?: string
  userId: string
  categoryId?: string
  currentStreak: number
  lastStudied?: Date
  category?: Category
  flashcards?: Flashcard[]
  tags?: Tag[]
  createdAt: Date
  updatedAt: Date
  _count?: {
    flashcards: number
  }
}

export interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: Difficulty
  deckId: string
  deck?: Deck
  progress?: Progress[]
  tags?: Tag[]
  createdAt: Date
  updatedAt: Date
}

export interface Progress {
  id: string
  flashcardId: string
  status: CardStatus
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: Date
  lastReviewed?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  name: string
  color: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface StudySession {
  deckId: string
  flashcards: Flashcard[]
  currentIndex: number
  isComplete: boolean
}

export interface GenerateFlashcardsRequest {
  content: string
  count?: number
  deckId?: string
}
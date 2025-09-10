'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Eye, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Deck, Flashcard, CardStatus } from '@/types'

interface StudyModeProps {
  deck: Deck & {
    flashcards: (Flashcard & {
      progress?: any
    })[]
  }
}

export function StudyMode({ deck }: StudyModeProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [studyCards, setStudyCards] = useState(deck.flashcards)
  const [completedCards, setCompletedCards] = useState(0)

  const currentCard = studyCards[currentIndex]
  const progress = ((currentIndex + (showAnswer ? 0.5 : 0)) / studyCards.length) * 100

  const handleCardResponse = async (quality: number) => {
    if (!currentCard) return

    try {
      // Update progress on server
      await fetch(`/api/flashcards/${currentCard.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality, deckId: deck.id }),
      })

      // Move to next card
      if (currentIndex < studyCards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
        setCompletedCards(completedCards + 1)
      } else {
        // Study session complete - update deck streak
        await fetch(`/api/decks/${deck.id}/study-complete`, {
          method: 'POST',
        })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
  }

  const handleNextCard = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setCompletedCards(0)
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center shadow-sm border border-border">
          <CardContent className="p-8">
            <CheckCircle className="w-10 h-10 mx-auto mb-4 text-foreground" />
            <h2 className="text-xl font-medium mb-2">Study Complete</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              You've completed all cards in this deck.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRestart} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Study Again
              </Button>
              <Button onClick={() => router.push('/dashboard')} className="flex-1">
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <div className="flex-1 text-center">
              <h1 className="text-lg font-medium text-foreground truncate">
                {deck.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {currentIndex + 1} / {studyCards.length}
              </div>
            </div>
          </div>
          
          {/* Minimal Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-0.5">
              <div 
                className="bg-foreground h-0.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          {/* Main Flashcard - Notion Style */}
          <div className="relative">
            <Card className="min-h-[450px] shadow-sm border border-border bg-card">
              <CardContent className="p-0 h-full">
                <div className="flex flex-col h-full">
                  {/* Card Content Area */}
                  <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center max-w-2xl w-full space-y-8">
                      {/* Question */}
                      <div>
                        <div className="text-2xl lg:text-3xl font-normal leading-relaxed text-foreground mb-6">
                          <div className="whitespace-pre-wrap">
                            {currentCard.front.split('```').map((part: string, i: number) => {
                              if (i % 2 === 1) {
                                // This is code
                                return (
                                  <div key={i} className="bg-muted p-4 rounded-lg border my-4 overflow-x-auto text-base">
                                    <code className="font-mono text-foreground">{part.trim()}</code>
                                  </div>
                                )
                              } else {
                                // This is regular text
                                return <span key={i} className="font-sans">{part}</span>
                              }
                            })}
                          </div>
                        </div>
                        
                        {/* Difficulty Badge - Minimal */}
                        <div className="flex justify-center">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded">
                            {currentCard.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Answer (when revealed) */}
                      {showAnswer && (
                        <div className="border-t border-border pt-8 animate-fade-in">
                          <div className="text-xl lg:text-2xl font-normal leading-relaxed text-muted-foreground text-left">
                            <div className="whitespace-pre-wrap">
                              {currentCard.back.split('```').map((part: string, i: number) => {
                                if (i % 2 === 1) {
                                  // This is code
                                  return (
                                    <div key={i} className="bg-muted p-4 rounded-lg border my-4 overflow-x-auto text-sm">
                                      <code className="font-mono text-foreground">{part.trim()}</code>
                                    </div>
                                  )
                                } else {
                                  // This is regular text
                                  return <span key={i} className="font-sans">{part}</span>
                                }
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Area - Notion Style */}
                  <div className="border-t border-border bg-muted/30 p-6">
                    {!showAnswer ? (
                      /* Show Answer Button */
                      <div className="flex justify-center">
                        <Button 
                          onClick={handleShowAnswer}
                          size="lg"
                          className="px-8 py-3 text-base font-medium"
                        >
                          Show Answer
                        </Button>
                      </div>
                    ) : (
                      /* Rating Buttons - Minimal Notion Style */
                      <div className="space-y-6">
                        <div className="text-center text-sm text-muted-foreground">
                          How well did you know this?
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          {/* Again */}
                          <Button
                            onClick={() => handleCardResponse(1)}
                            variant="outline"
                            className="flex-1 h-12 text-sm font-medium hover:bg-muted"
                          >
                            <div className="text-center">
                              <div>Again</div>
                              <div className="text-xs text-muted-foreground">&lt;1m</div>
                            </div>
                          </Button>

                          {/* Hard */}
                          <Button
                            onClick={() => handleCardResponse(2)}
                            variant="outline"
                            className="flex-1 h-12 text-sm font-medium hover:bg-muted"
                          >
                            <div className="text-center">
                              <div>Hard</div>
                              <div className="text-xs text-muted-foreground">6m</div>
                            </div>
                          </Button>

                          {/* Good */}
                          <Button
                            onClick={() => handleCardResponse(3)}
                            variant="outline"
                            className="flex-1 h-12 text-sm font-medium hover:bg-muted"
                          >
                            <div className="text-center">
                              <div>Good</div>
                              <div className="text-xs text-muted-foreground">1d</div>
                            </div>
                          </Button>

                          {/* Easy */}
                          <Button
                            onClick={() => handleCardResponse(4)}
                            className="flex-1 h-12 text-sm font-medium"
                          >
                            <div className="text-center">
                              <div>Easy</div>
                              <div className="text-xs opacity-75">4d</div>
                            </div>
                          </Button>
                        </div>

                        {/* Skip Option */}
                        <div className="text-center">
                          <Button
                            onClick={handleNextCard}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Skip without rating
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Study Stats - Minimal */}
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                <span>New {studyCards.length - currentIndex - 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                <span>Learning {completedCards}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                <span>Review 0</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
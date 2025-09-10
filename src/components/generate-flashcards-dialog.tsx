'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Deck } from '@/types'

interface GenerateFlashcardsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    decks: Deck[]
    onCardsGenerated?: () => void
}

export function GenerateFlashcardsDialog({
    open,
    onOpenChange,
    decks,
    onCardsGenerated,
}: GenerateFlashcardsDialogProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [content, setContent] = useState('')
    const [selectedDeckId, setSelectedDeckId] = useState('')
    const [count, setCount] = useState(5)
    const [isLoading, setIsLoading] = useState(false)
    const [generatedCards, setGeneratedCards] = useState<any[]>([])

    const handleSaveToSelectedDeck = async () => {
        if (!selectedDeckId || selectedDeckId === 'preview' || generatedCards.length === 0) return

        setIsLoading(true)
        try {
            // Save each card to the selected deck
            const promises = generatedCards.map(card =>
                fetch(`/api/decks/${selectedDeckId}/flashcards`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        front: card.front,
                        back: card.back,
                        difficulty: card.difficulty || 'MEDIUM',
                    }),
                })
            )

            await Promise.all(promises)

            const selectedDeck = decks.find(d => d.id === selectedDeckId)

            toast({
                title: "Flashcards Saved!",
                description: `Successfully saved ${generatedCards.length} flashcards to "${selectedDeck?.name}".`,
            })

            // Close dialog and reset state
            onOpenChange(false)
            setContent('')
            setGeneratedCards([])
            setSelectedDeckId('')

            // Navigate to the deck
            setTimeout(() => {
                router.push(`/deck/${selectedDeckId}`)
            }, 500)

            onCardsGenerated?.()
        } catch (error) {
            console.error('Error saving flashcards:', error)
            toast({
                title: "Save Failed",
                description: "Failed to save flashcards. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerate = async () => {
        if (!content.trim()) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    count,
                    deckId: selectedDeckId === 'preview' ? undefined : selectedDeckId,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                
                // Validate the response has flashcards
                if (!data.flashcards || !Array.isArray(data.flashcards) || data.flashcards.length === 0) {
                    toast({
                        title: "Generation Failed",
                        description: "No flashcards were generated. Please try with different content.",
                        variant: "destructive",
                    })
                    return
                }

                setGeneratedCards(data.flashcards)

                if (selectedDeckId && selectedDeckId !== 'preview') {
                    // Cards were saved to deck
                    const selectedDeck = decks.find(d => d.id === selectedDeckId)

                    toast({
                        title: "Flashcards Generated!",
                        description: `Successfully added ${data.flashcards.length} flashcards to "${selectedDeck?.name}".`,
                    })

                    // Close dialog and reset state
                    onOpenChange(false)
                    setContent('')
                    setGeneratedCards([])
                    setSelectedDeckId('')

                    // Navigate to the deck
                    setTimeout(() => {
                        router.push(`/deck/${selectedDeckId}`)
                    }, 500)

                    onCardsGenerated?.()
                } else {
                    // Preview mode
                    toast({
                        title: "Flashcards Generated!",
                        description: `Generated ${data.flashcards.length} flashcards. Select a deck to save them.`,
                    })
                }
            } else {
                const errorData = await response.json()
                toast({
                    title: "Generation Failed",
                    description: errorData.error || "Failed to generate flashcards. Please try again.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('Error generating flashcards:', error)
            toast({
                title: "Generation Failed",
                description: "An error occurred while generating flashcards. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Generate Flashcards with AI</DialogTitle>
                    <DialogDescription>
                        Paste your content and let AI generate flashcards for you.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            Content to generate from:
                        </Label>
                        <Textarea
                            placeholder="Paste your text, notes, or study material here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                            className="resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium mb-2 block">
                                Number of cards:
                            </Label>
                            <Select value={count.toString()} onValueChange={(value) => setCount(Number(value))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select count" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[3, 5, 8, 10, 15, 20].map(num => (
                                        <SelectItem key={num} value={num.toString()}>{num} cards</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-sm font-medium mb-2 block">
                                Save to deck (optional):
                            </Label>
                            <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Preview only" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="preview">Preview only</SelectItem>
                                    {decks.map(deck => (
                                        <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading || !content.trim()}
                        className="w-full"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating... (this may take 15-30s)</span>
                            </div>
                        ) : (
                            'Generate Flashcards'
                        )}
                    </Button>

                    {generatedCards.length > 0 && (selectedDeckId === 'preview' || !selectedDeckId) && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium">Generated Flashcards Preview:</h3>
                                <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select deck to save" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {decks.map(deck => (
                                            <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                                {generatedCards.map((card, index) => (
                                    <div key={index} className="p-4 border rounded-lg bg-card">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">Question {index + 1}</span>
                                                {card.difficulty && (
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        card.difficulty === 'EASY' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                        card.difficulty === 'HARD' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                    }`}>
                                                        {card.difficulty}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Question</div>
                                                <div className="font-medium text-sm leading-relaxed p-3 bg-muted/30 rounded-md">
                                                    <MarkdownRenderer content={card.front} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Answer</div>
                                                <div className="text-sm leading-relaxed p-3 bg-muted/30 rounded-md">
                                                    <MarkdownRenderer content={card.back} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {selectedDeckId && selectedDeckId !== 'preview' && (
                                <Button
                                    onClick={handleSaveToSelectedDeck}
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : `Save to ${decks.find(d => d.id === selectedDeckId)?.name}`}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
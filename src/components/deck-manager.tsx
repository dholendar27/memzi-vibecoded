'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, Play, Settings, Tag as TagIcon, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Deck, Flashcard, Difficulty, Category, Tag } from '@/types'

interface DeckManagerProps {
  deck: Deck & {
    flashcards: Flashcard[]
  }
}

export function DeckManager({ deck: initialDeck }: DeckManagerProps) {
  const router = useRouter()
  const [deck, setDeck] = useState(initialDeck)

  useEffect(() => {
    fetchCategoriesAndTags()
  }, [])

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags')
      ])
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }
      
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        setTags(tagsData)
      }
    } catch (error) {
      console.error('Error fetching categories and tags:', error)
    }
  }
  const [showAddCard, setShowAddCard] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [newCardFront, setNewCardFront] = useState('')
  const [newCardBack, setNewCardBack] = useState('')
  const [newCardDifficulty, setNewCardDifficulty] = useState<Difficulty>(Difficulty.MEDIUM)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDeck, setShowEditDeck] = useState(false)
  const [editDeckName, setEditDeckName] = useState(deck.name)
  const [editDeckDescription, setEditDeckDescription] = useState(deck.description || '')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(deck.categoryId || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(deck.tags?.map(tag => tag.id) || [])

  const handleAddCard = async () => {
    if (!newCardFront.trim() || !newCardBack.trim()) return

    try {
      const response = await fetch(`/api/decks/${deck.id}/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: newCardFront,
          back: newCardBack,
          difficulty: newCardDifficulty,
        }),
      })

      if (response.ok) {
        const newCard = await response.json()
        setDeck({
          ...deck,
          flashcards: [newCard, ...deck.flashcards]
        })
        setNewCardFront('')
        setNewCardBack('')
        setNewCardDifficulty(Difficulty.MEDIUM)
        setShowAddCard(false)
      }
    } catch (error) {
      console.error('Error adding card:', error)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return

    try {
      const response = await fetch(`/api/flashcards/${cardId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeck({
          ...deck,
          flashcards: deck.flashcards.filter(card => card.id !== cardId)
        })
      }
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const handleDeleteDeck = async () => {
    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting deck:', error)
    }
  }

  const handleEditDeck = async () => {
    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDeckName,
          description: editDeckDescription,
          categoryId: selectedCategoryId || null,
          tagIds: selectedTagIds,
        }),
      })

      if (response.ok) {
        const updatedDeck = await response.json()
        setDeck({ 
          ...deck, 
          name: updatedDeck.name, 
          description: updatedDeck.description,
          categoryId: updatedDeck.categoryId,
          category: categories.find(c => c.id === updatedDeck.categoryId),
          tags: tags.filter(t => selectedTagIds.includes(t.id))
        })
        setShowEditDeck(false)
      }
    } catch (error) {
      console.error('Error updating deck:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold truncate">{deck.name}</h1>
                {deck.description && (
                  <p className="text-muted-foreground text-sm truncate">
                    {deck.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {deck.category && (
                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                      <FolderOpen className="w-3 h-3" />
                      <span>{deck.category.name}</span>
                    </div>
                  )}
                  {deck.tags && deck.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {deck.tags.slice(0, 3).map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: tag.color + '20', color: tag.color }}
                        >
                          <TagIcon className="w-3 h-3" />
                          <span>{tag.name}</span>
                        </div>
                      ))}
                      {deck.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{deck.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => router.push(`/study/${deck.id}`)}
                disabled={deck.flashcards.length === 0}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Study</span>
              </Button>
              <Button 
                onClick={() => setShowAddCard(true)}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Card</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDeck(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Deck
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Deck
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {showAddCard && (
          <Card className="mb-6 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Add New Flashcard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Front (Question):
                    </Label>
                    <Textarea
                      placeholder="Enter the question or prompt..."
                      value={newCardFront}
                      onChange={(e) => setNewCardFront(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Back (Answer):
                    </Label>
                    <Textarea
                      placeholder="Enter the answer or explanation..."
                      value={newCardBack}
                      onChange={(e) => setNewCardBack(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Difficulty:
                    </Label>
                    <Select value={newCardDifficulty} onValueChange={(value) => setNewCardDifficulty(value as Difficulty)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Difficulty.EASY}>Easy</SelectItem>
                        <SelectItem value={Difficulty.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={Difficulty.HARD}>Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCard}
                    disabled={!newCardFront.trim() || !newCardBack.trim()}
                    size="sm"
                  >
                    Add Card
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddCard(false)
                      setNewCardFront('')
                      setNewCardBack('')
                      setNewCardDifficulty(Difficulty.MEDIUM)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {deck.flashcards.length === 0 ? (
          <Card className="text-center py-16 border-0 shadow-none bg-muted/30">
            <CardContent>
              <h3 className="text-lg font-medium mb-2">No flashcards yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first flashcard to start studying
              </p>
              <Button onClick={() => setShowAddCard(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {deck.flashcards.map((card) => (
              <Card key={card.id} className="border-border/50">
                <CardContent className="p-5">
                  <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
                    <div>
                      <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                        Front
                      </h4>
                      <p className="text-foreground leading-relaxed">
                        {card.front}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                        Back
                      </h4>
                      <p className="text-foreground leading-relaxed">
                        {card.back}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          card.difficulty === 'EASY' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          card.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {card.difficulty}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCard(card)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Deck Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deck</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deck.name}"? This action cannot be undone and will delete all flashcards in this deck.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDeck}>
              Delete Deck
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deck Dialog */}
      <Dialog open={showEditDeck} onOpenChange={setShowEditDeck}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deck</DialogTitle>
            <DialogDescription>
              Update your deck information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Deck Name:
              </Label>
              <Input
                value={editDeckName}
                onChange={(e) => setEditDeckName(e.target.value)}
                placeholder="Enter deck name"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Description (optional):
              </Label>
              <Textarea
                value={editDeckDescription}
                onChange={(e) => setEditDeckDescription(e.target.value)}
                placeholder="Enter deck description"
                rows={3}
                className="resize-none"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Category (optional):
              </Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Tags (optional):
              </Label>
              <div className="space-y-2">
                {tags.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTagIds([...selectedTagIds, tag.id])
                            } else {
                              setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id))
                            }
                          }}
                          className="rounded"
                        />
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags available. Create tags in the dashboard.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDeck(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDeck} disabled={!editDeckName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Deck, Category, Tag } from '@/types'

interface CreateDeckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeckCreated: (deck: Deck) => void
}

export function CreateDeckDialog({
  open,
  onOpenChange,
  onDeckCreated,
}: CreateDeckDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchCategoriesAndTags()
    }
  }, [open])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          description,
          categoryId: categoryId || undefined,
          tagIds: selectedTags
        }),
      })

      if (response.ok) {
        const deck = await response.json()
        onDeckCreated(deck)
        
        toast({
          title: "Deck Created!",
          description: `Successfully created "${name}" deck.`,
        })
        
        // Reset form
        setName('')
        setDescription('')
        setCategoryId('')
        setSelectedTags([])
      } else {
        const errorData = await response.json()
        toast({
          title: "Creation Failed",
          description: errorData.error || "Failed to create deck. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating deck:', error)
      toast({
        title: "Creation Failed",
        description: "An error occurred while creating the deck. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>
            Create a new flashcard deck to organize your learning materials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deck-name">Deck Name</Label>
              <Input
                id="deck-name"
                placeholder="Enter deck name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="deck-description">Description (optional)</Label>
              <Textarea
                id="deck-description"
                placeholder="Enter deck description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div>
              <Label htmlFor="deck-category">Category (optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(category => (
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
              <Label>Tags (optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-md min-h-[40px]">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      if (selectedTags.includes(tag.id)) {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id))
                      } else {
                        setSelectedTags([...selectedTags, tag.id])
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && (
                  <span className="text-sm text-muted-foreground">No tags available</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Creating...' : 'Create Deck'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
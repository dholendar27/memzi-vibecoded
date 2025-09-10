'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Tag as TagIcon, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tag } from '@/types'

interface TagsManagerProps {
  onTagCreated?: () => void
}

export function TagsManager({ onTagCreated }: TagsManagerProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags'
      const method = editingTag ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })

      if (response.ok) {
        await fetchTags()
        resetForm()
        onTagCreated?.()
      }
    } catch (error) {
      console.error('Error saving tag:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTags()
        onTagCreated?.()
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
    }
  }

  const resetForm = () => {
    setName('')
    setColor('#3b82f6')
    setEditingTag(null)
    setShowCreateDialog(false)
  }

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag)
    setName(tag.name)
    setColor(tag.color)
    setShowCreateDialog(true)
  }

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold mb-2 tracking-tight">Tags</h2>
          <p className="text-muted-foreground">Label your content with tags</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card className="text-center py-16 border-0 shadow-none bg-muted/30">
          <CardContent>
            <TagIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No tags yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first tag to label your flashcards
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Card 
              key={tag.id} 
              className="group hover:shadow-md transition-all duration-200 cursor-pointer"
              style={{ borderColor: tag.color + '40' }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4" style={{ color: tag.color }} />
                  <span className="font-medium">{tag.name}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(tag)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </DialogTitle>
            <DialogDescription>
              {editingTag 
                ? 'Update your tag information.' 
                : 'Create a new tag to label your flashcards.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tag name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {predefinedColors.map((presetColor) => (
                      <button
                        key={presetColor}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          color === presetColor ? 'border-foreground scale-110' : 'border-border'
                        }`}
                        style={{ backgroundColor: presetColor }}
                        onClick={() => setColor(presetColor)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? 'Saving...' : editingTag ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
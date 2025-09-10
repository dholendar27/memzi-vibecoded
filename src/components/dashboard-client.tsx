'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, Brain, LogOut, BarChart3, Tag, FolderOpen, User, Calendar, Target, Flame, Play, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CreateDeckDialog } from '@/components/create-deck-dialog'
import { GenerateFlashcardsDialog } from '@/components/generate-flashcards-dialog'
import { CategoriesManager } from '@/components/categories-manager'
import { TagsManager } from '@/components/tags-manager'
import { Deck } from '@/types'
import Link from 'next/link'

interface DashboardClientProps {
  initialDecks: Deck[]
}

export function DashboardClient({ initialDecks }: DashboardClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [decks, setDecks] = useState(initialDecks)

  // Update decks when initialDecks prop changes
  useEffect(() => {
    setDecks(initialDecks)
  }, [initialDecks])
  const [showCreateDeck, setShowCreateDeck] = useState(false)
  const [showGenerateCards, setShowGenerateCards] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('decks')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleDeckCreated = async (newDeck: Deck) => {
    setDecks([newDeck, ...decks])
    setShowCreateDeck(false)
    await fetchStats()
  }

  const handleCardsGenerated = async () => {
    // Refresh decks data and stats
    await Promise.all([fetchDecks(), fetchStats()])
  }

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab)
    // Refresh data when switching to overview tab
    if (tab === 'overview') {
      await Promise.all([fetchDecks(), fetchStats()])
    }
  }

  const fetchDecks = async () => {
    try {
      const response = await fetch('/api/decks')
      if (response.ok) {
        const data = await response.json()
        setDecks(data)
      }
    } catch (error) {
      console.error('Error fetching decks:', error)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchDecks() // Also fetch latest decks
    setActiveTab('overview') // Set default tab to overview
  }, [])

  // Refresh data when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh data
        fetchStats()
        fetchDecks()
      }
    }

    const handleFocus = () => {
      // Window gained focus, refresh data
      fetchStats()
      fetchDecks()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        cache: 'no-store' // Ensure fresh data
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const refreshAllData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([fetchDecks(), fetchStats()])
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 flex-shrink-0">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">Memzi</h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="hidden sm:block text-sm text-muted-foreground">
                  Welcome, {session?.user?.name}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/profile">
                        <User className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Profile</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View your profile</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sign out of your account</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar Navigation */}
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 border-r border-border bg-background/50 backdrop-blur hidden lg:block">
            <nav className="p-4 space-y-2 h-full overflow-y-auto">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('overview')}
                className="w-full justify-start transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'decks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('decks')}
                className="w-full justify-start transition-all duration-200"
              >
                <BookOpen className="w-4 h-4 mr-3" />
                Decks
                {stats && stats.totalDecks > 0 && (
                  <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium min-w-[1.5rem] text-center">
                    {stats.totalDecks}
                  </span>
                )}
              </Button>
              <Button
                variant={activeTab === 'categories' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('categories')}
                className="w-full justify-start transition-all duration-200"
              >
                <FolderOpen className="w-4 h-4 mr-3" />
                Categories
                {stats && (
                  <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium min-w-[1.5rem] text-center">
                    {stats.totalCategories || 0}
                  </span>
                )}
              </Button>
              <Button
                variant={activeTab === 'tags' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('tags')}
                className="w-full justify-start transition-all duration-200"
              >
                <Tag className="w-4 h-4 mr-3" />
                Tags
                {stats && (
                  <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium min-w-[1.5rem] text-center">
                    {stats.totalTags || 0}
                  </span>
                )}
              </Button>
            </nav>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50">
            <div className="flex justify-around py-2">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('overview')}
                className="flex-col h-auto py-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs mt-1">Overview</span>
              </Button>
              <Button
                variant={activeTab === 'decks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('decks')}
                className="flex-col h-auto py-2"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-xs mt-1">Decks</span>
              </Button>
              <Button
                variant={activeTab === 'categories' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('categories')}
                className="flex-col h-auto py-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="text-xs mt-1">Categories</span>
              </Button>
              <Button
                variant={activeTab === 'tags' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('tags')}
                className="flex-col h-auto py-2"
              >
                <Tag className="w-4 h-4" />
                <span className="text-xs mt-1">Tags</span>
              </Button>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-semibold mb-2 tracking-tight">Overview</h2>
                      <p className="text-muted-foreground">Your learning dashboard and statistics</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshAllData}
                      disabled={isRefreshing}
                      className="shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>

                  {stats ? (
                    <>
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{stats.totalDecks}</p>
                                <p className="text-xs text-muted-foreground">Decks</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{stats.totalFlashcards}</p>
                                <p className="text-xs text-muted-foreground">Cards</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{stats.studyStreak}</p>
                                <p className="text-xs text-muted-foreground">Day Streak</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{stats.recentActivity}</p>
                                <p className="text-xs text-muted-foreground">This Week</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recent Decks */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Recent Decks</span>
                            {decks.length > 0 && (
                              <Button variant="outline" size="sm" onClick={() => handleTabChange('decks')}>
                                View All
                              </Button>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {decks.slice(0, 3).length > 0 ? (
                            <div className="space-y-3">
                              {decks.slice(0, 3).map((deck) => (
                                <div key={deck.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{deck.name}</h4>
                                      {deck.currentStreak > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                          <Flame className="w-3 h-3" />
                                          <span>{deck.currentStreak}</span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {deck._count?.flashcards || 0} cards
                                    </p>
                                  </div>
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={`/study/${deck.id}`}>
                                      <Play className="w-3 h-3 mr-2" />
                                      Study
                                    </Link>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-muted-foreground mb-4">No decks created yet</p>
                              <Button onClick={() => handleTabChange('decks')} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Deck
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-8">Loading overview...</div>
                  )}
                </div>
              )}

              {activeTab === 'decks' && (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-2 tracking-tight">Your Decks</h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Manage your flashcard decks and track your progress
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setShowGenerateCards(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Generate with AI</span>
                  <span className="sm:hidden">AI</span>
                </Button>
                <Button 
                  onClick={() => setShowCreateDeck(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">New Deck</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>

            {decks.length === 0 ? (
              <Card className="text-center py-16 border-0 shadow-none bg-muted/30">
                <CardContent>
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No decks yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first deck to start learning
                  </p>
                  <Button onClick={() => setShowCreateDeck(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Deck
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {decks.map((deck) => (
                  <Card key={deck.id} className="group cursor-pointer border-border/50 hover-lift">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-start justify-between text-base font-medium gap-2">
                        <span className="truncate flex-1">{deck.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {deck.currentStreak > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                  <Flame className="w-3 h-3" />
                                  <span className="font-medium">{deck.currentStreak}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Study streak: {deck.currentStreak} days</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                            {deck._count?.flashcards || 0}
                          </span>
                        </div>
                      </CardTitle>
                      {deck.description && (
                        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                          {deck.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button asChild size="sm" className="flex-1 h-8 text-xs">
                          <Link href={`/study/${deck.id}`}>
                            <BookOpen className="w-3 h-3 mr-1 sm:mr-2" />
                            Study
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1 h-8 text-xs">
                          <Link href={`/deck/${deck.id}`}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

              {activeTab === 'categories' && (
                <CategoriesManager onCategoryCreated={fetchStats} />
              )}

              {activeTab === 'tags' && (
                <TagsManager onTagCreated={fetchStats} />
              )}
            </div>
          </main>
        </div>

      <CreateDeckDialog
        open={showCreateDeck}
        onOpenChange={setShowCreateDeck}
        onDeckCreated={handleDeckCreated}
      />

      <GenerateFlashcardsDialog
        open={showGenerateCards}
        onOpenChange={setShowGenerateCards}
        decks={decks}
        onCardsGenerated={handleCardsGenerated}
      />
      </div>
    </TooltipProvider>
  )
}
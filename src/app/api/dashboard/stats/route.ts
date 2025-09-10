import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get total counts
    const [totalDecks, totalFlashcards, totalCategories, totalTags] = await Promise.all([
      prisma.deck.count({ where: { userId } }),
      prisma.flashcard.count({ where: { deck: { userId } } }),
      prisma.category.count({ where: { userId } }),
      prisma.tag.count({ where: { userId } })
    ])

    // Get progress stats
    const progressStats = await prisma.progress.groupBy({
      by: ['status'],
      where: {
        flashcard: {
          deck: {
            userId
          }
        }
      },
      _count: {
        status: true
      }
    })

    // Get difficulty distribution
    const difficultyStats = await prisma.flashcard.groupBy({
      by: ['difficulty'],
      where: {
        deck: {
          userId
        }
      },
      _count: {
        difficulty: true
      }
    })

    // Get recent activity (cards studied in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = await prisma.progress.count({
      where: {
        flashcard: {
          deck: {
            userId
          }
        },
        lastReviewed: {
          gte: sevenDaysAgo
        }
      }
    })

    // Get study streak (consecutive days with activity)
    const studyStreak = await calculateStudyStreak(userId)

    return NextResponse.json({
      totalDecks,
      totalFlashcards,
      totalCategories,
      totalTags,
      progressStats,
      difficultyStats,
      recentActivity,
      studyStreak
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function calculateStudyStreak(userId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let streak = 0
    let currentDate = new Date(today)
    
    for (let i = 0; i < 30; i++) { // Check last 30 days max
      const nextDate = new Date(currentDate)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const activityCount = await prisma.progress.count({
        where: {
          flashcard: {
            deck: {
              userId
            }
          },
          lastReviewed: {
            gte: currentDate,
            lt: nextDate
          }
        }
      })
      
      if (activityCount > 0) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  } catch (error) {
    return 0
  }
}
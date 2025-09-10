import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deckId = params.id

    // Verify deck belongs to user
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId: session.user.id
      }
    })

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const lastStudied = deck.lastStudied ? new Date(deck.lastStudied) : null
    let newStreak = deck.currentStreak

    if (lastStudied) {
      const lastStudiedDate = new Date(lastStudied)
      lastStudiedDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - lastStudiedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        // Consecutive day - increment streak
        newStreak = deck.currentStreak + 1
      } else if (daysDiff === 0) {
        // Same day - keep current streak
        newStreak = deck.currentStreak
      } else {
        // Gap in studying - reset streak
        newStreak = 1
      }
    } else {
      // First time studying this deck
      newStreak = 1
    }

    // Update deck with new streak and last studied date
    const updatedDeck = await prisma.deck.update({
      where: { id: deckId },
      data: {
        currentStreak: newStreak,
        lastStudied: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      streak: newStreak,
      deck: updatedDeck 
    })
  } catch (error) {
    console.error('Error updating deck streak:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateNextReview } from '@/lib/utils'
import { CardStatus } from '@/types'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quality, deckId } = await request.json()
    const flashcardId = params.id

    // Verify flashcard belongs to user
    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id: flashcardId,
        deck: {
          userId: session.user.id
        }
      },
      include: {
        progress: true
      }
    })

    if (!flashcard) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 })
    }

    const currentProgress = flashcard.progress[0] // Get the first (and should be only) progress record

    // Calculate new progress values
    const { easeFactor, interval, nextReview } = calculateNextReview(
      currentProgress?.easeFactor || 2.5,
      currentProgress?.interval || 1,
      quality
    )

    // Determine new status
    let newStatus: CardStatus
    if (quality >= 4) {
      newStatus = CardStatus.LEARNED
    } else if (quality >= 3) {
      newStatus = CardStatus.REVIEW
    } else {
      newStatus = CardStatus.LEARNING
    }

    // Update or create progress
    const updatedProgress = await prisma.progress.upsert({
      where: {
        flashcardId: flashcardId
      },
      update: {
        status: newStatus,
        easeFactor,
        interval,
        repetitions: (currentProgress?.repetitions || 0) + 1,
        nextReview,
        lastReviewed: new Date(),
      },
      create: {
        flashcardId,
        status: newStatus,
        easeFactor,
        interval,
        repetitions: 1,
        nextReview,
        lastReviewed: new Date(),
      }
    })

    return NextResponse.json(updatedProgress)
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
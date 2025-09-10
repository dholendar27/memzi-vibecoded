import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateFlashcards } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const generateSchema = z.object({
  content: z.string().min(1),
  count: z.number().min(1).max(20).default(5),
  deckId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, count, deckId } = generateSchema.parse(body)

    // Generate flashcards using Gemini
    const generatedCards = await generateFlashcards(content, count)

    // If deckId is provided, save to that deck
    if (deckId) {
      // Use a single transaction to reduce connection usage
      const result = await prisma.$transaction(async (tx) => {
        // Verify deck belongs to user
        const deck = await tx.deck.findFirst({
          where: {
            id: deckId,
            userId: session.user.id
          }
        })

        if (!deck) {
          throw new Error('Deck not found')
        }

        // Create flashcards one by one to avoid bulk operation issues
        const createdCards = []
        for (const card of generatedCards) {
          const flashcard = await tx.flashcard.create({
            data: {
              front: card.front,
              back: card.back,
              difficulty: card.difficulty || 'MEDIUM',
              deckId: deckId,
            }
          })
          createdCards.push(flashcard)
        }

        return createdCards
      })

      return NextResponse.json({ flashcards: result })
    }

    // Return generated cards without saving
    return NextResponse.json({ flashcards: generatedCards })
  } catch (error) {
    console.error('Generate flashcards error:', error)
    return NextResponse.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    )
  }
}
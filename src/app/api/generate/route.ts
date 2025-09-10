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

      // Create flashcards in the deck
      const flashcards = await Promise.all(
        generatedCards.map((card: any) =>
          prisma.flashcard.create({
            data: {
              front: card.front,
              back: card.back,
              difficulty: card.difficulty || 'MEDIUM',
              deckId: deckId,
            }
          })
        )
      )

      return NextResponse.json({ flashcards })
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
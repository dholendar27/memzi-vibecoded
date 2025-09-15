import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateFlashcards } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

const generateSchema = z.object({
  content: z.string().min(1),
  count: z.number().min(1).max(20).default(5),
  deckId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // Set timeout for the entire request (45 seconds)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout - AI generation took too long')), 45000)
  })

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, count, deckId } = generateSchema.parse(body)

    // Validate content length
    if (content.length > 10000) {
      return NextResponse.json({ error: 'Content too long. Please limit to 10,000 characters.' }, { status: 400 })
    }

    // Generate flashcards using Gemini with timeout
    const generatedCards = await Promise.race([
      generateFlashcards(content, count),
      timeoutPromise
    ]) as any[]

    if (!generatedCards || generatedCards.length === 0) {
      return NextResponse.json({ error: 'No flashcards were generated. Please try with different content.' }, { status: 400 })
    }

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
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate flashcards'
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try with shorter content or fewer cards.'
      } else if (error.message.includes('JSON')) {
        errorMessage = 'AI response formatting error. Please try again.'
      } else if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error. Please contact support.'
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
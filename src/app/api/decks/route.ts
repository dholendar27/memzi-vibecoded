import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

const createDeckSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decks = await prisma.deck.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { flashcards: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(decks)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, categoryId, tagIds } = createDeckSchema.parse(body)

    const deck = await prisma.deck.create({
      data: {
        name,
        description,
        userId: session.user.id,
        categoryId: categoryId === 'none' ? null : categoryId,
        currentStreak: 0,
        tags: tagIds && tagIds.length > 0 ? {
          connect: tagIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        _count: {
          select: { flashcards: true }
        },
        category: true,
        tags: true,
      }
    })

    return NextResponse.json(deck)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
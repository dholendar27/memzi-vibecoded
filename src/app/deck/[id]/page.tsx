import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DeckManager } from '@/components/deck-manager'

interface DeckPageProps {
  params: {
    id: string
  }
}

export default async function DeckPage({ params }: DeckPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const deck = await prisma.deck.findFirst({
    where: {
      id: params.id,
      userId: session.user.id
    },
    include: {
      flashcards: {
        orderBy: { createdAt: 'desc' }
      },
      category: true,
      tags: true
    }
  })

  if (!deck) {
    redirect('/dashboard')
  }

  // Transform the data to match the expected type
  const transformedDeck = {
    ...deck,
    description: deck.description || undefined,
    lastStudied: deck.lastStudied || undefined,
    categoryId: deck.categoryId || undefined
  }

  return <DeckManager deck={transformedDeck} />
}
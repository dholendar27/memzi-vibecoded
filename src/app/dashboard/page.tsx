import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from '@/components/dashboard-client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
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

  // Transform the data to match the expected type
  const transformedDecks = decks.map(deck => ({
    ...deck,
    description: deck.description || undefined,
    lastStudied: deck.lastStudied || undefined,
    categoryId: deck.categoryId || undefined
  }))

  return <DashboardClient initialDecks={transformedDecks} />
}
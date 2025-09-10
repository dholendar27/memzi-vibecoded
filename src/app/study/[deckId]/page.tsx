import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StudyMode } from '@/components/study-mode'

interface StudyPageProps {
  params: {
    deckId: string
  }
}

export default async function StudyPage({ params }: StudyPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const deck = await prisma.deck.findFirst({
    where: {
      id: params.deckId,
      userId: session.user.id
    },
    include: {
      flashcards: {
        include: {
          progress: true
        }
      }
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

  return <StudyMode deck={transformedDeck} />
}
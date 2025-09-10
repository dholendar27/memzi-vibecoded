import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-foreground mb-2 tracking-tight">
              Memzi
            </h1>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
          </div>
          <h2 className="text-4xl font-semibold text-foreground mb-6 tracking-tight">
            Master Any Subject
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Create, study, and master flashcards with AI-powered generation and spaced repetition algorithm
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild size="lg" className="px-6">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="px-6">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-0 shadow-none bg-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">AI-Powered Generation</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Generate flashcards automatically from any text using Google Gemini AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-none bg-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Spaced Repetition</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Optimize your learning with scientifically-proven spaced repetition algorithm
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-none bg-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Progress Tracking</CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Track your learning progress and see your improvement over time
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
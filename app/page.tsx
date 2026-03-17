import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dumbbell, TrendingUp, Target, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 md:px-6 mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-bold">GymTracker</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container px-4 md:px-6 mx-auto py-16 md:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center gap-6 md:gap-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Track. Progress. Improve.
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Your Personal Gym Workout Tracker
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
              Log every workout, track your progress on each machine, and get smart weight
              recommendations to keep pushing your limits.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Start Tracking Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
              Everything you need to track your gains
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              <FeatureCard
                icon={Dumbbell}
                title="Machine Library"
                description="Create a personalized library of gym machines with photos and notes. Know exactly which muscles each exercise targets."
              />
              <FeatureCard
                icon={BarChart3}
                title="Progress Charts"
                description="Visualize your strength gains with detailed charts showing weight progression, volume, and estimated 1RM over time."
              />
              <FeatureCard
                icon={Target}
                title="Muscle Coverage"
                description="Never skip leg day again. Track which muscle groups you've trained and get alerts for neglected areas."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center gap-4 md:gap-6 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold">Ready to level up your training?</h2>
              <p className="text-muted-foreground">
                Join GymTracker today and start logging your workouts. It's free to get started.
              </p>
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container px-4 md:px-6 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span>GymTracker</span>
          </div>
          <p>Built for fitness enthusiasts</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center gap-4 p-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

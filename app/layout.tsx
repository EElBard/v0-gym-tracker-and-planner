import { Geist, Geist_Mono, Press_Start_2P, Chakra_Petch } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const pressStart2P = Press_Start_2P({ weight: '400', subsets: ["latin"], variable: "--font-retro" });
const chakraPetch = Chakra_Petch({ weight: ['400', '600', '700'], subsets: ["latin"], variable: "--font-tech" });

export const metadata: Metadata = {
  title: 'GymTracker - Track Your Workouts',
  description: 'Log your gym workouts, track progress, and get personalized weight recommendations',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1b4b' },
  ],
}

import { PetProvider } from '@/lib/context/pet-context'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${pressStart2P.variable} ${chakraPetch.variable} font-sans antialiased`}>
        <PetProvider>
          {children}
        </PetProvider>
        <Analytics />
      </body>
    </html>
  )
}

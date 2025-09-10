'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // More comprehensive iOS detection
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(iOS)

    // Check if app is already installed (multiple methods)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://')
    setIsStandalone(standalone)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // For iOS, show install prompt if not in standalone mode and not dismissed
    if (iOS && !standalone && !sessionStorage.getItem('pwa-install-dismissed')) {
      setTimeout(() => setShowInstallPrompt(true), 2000) // Delay for better UX
    }

    // For Android, check if criteria are met
    if (!iOS && !standalone && !sessionStorage.getItem('pwa-install-dismissed')) {
      // Show prompt after a delay even if beforeinstallprompt doesn't fire
      setTimeout(() => {
        if (!deferredPrompt) {
          setShowInstallPrompt(true)
        }
      }, 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log('User choice:', outcome)
        
        if (outcome === 'accepted') {
          setDeferredPrompt(null)
          setShowInstallPrompt(false)
        }
      } catch (error) {
        console.error('Error during install prompt:', error)
      }
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      alert('To install this app:\n\n' +
            'Android: Tap the menu button (⋮) and select "Add to Home Screen"\n' +
            'iOS: Tap the share button (↗) and select "Add to Home Screen"')
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Remember user dismissed for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already installed, dismissed, or not supported
  if (isStandalone || !showInstallPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install Memzi</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isIOS 
                ? 'Tap the Share button (↗) and select "Add to Home Screen"'
                : 'Install our app for offline access and better performance'
              }
            </p>
            <div className="flex gap-2 mt-3">
              {!isIOS && deferredPrompt && (
                <Button size="sm" onClick={handleInstallClick} className="text-xs h-8">
                  Install
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDismiss} className="text-xs h-8">
                {isIOS ? 'Got it' : 'Later'}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
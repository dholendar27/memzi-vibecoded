'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PWADebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = {
        userAgent: navigator.userAgent,
        standalone: (window.navigator as any).standalone,
        displayMode: window.matchMedia('(display-mode: standalone)').matches,
        serviceWorker: 'serviceWorker' in navigator,
        beforeInstallPrompt: 'onbeforeinstallprompt' in window,
        manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
        isAndroid: /Android/.test(navigator.userAgent),
        protocol: window.location.protocol,
        host: window.location.host,
      }
      setDebugInfo(info)
    }
  }, [])

  if (process.env.NODE_ENV !== 'development' && !showDebug) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!showDebug ? (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setShowDebug(true)}
          className="opacity-50 hover:opacity-100"
        >
          PWA Debug
        </Button>
      ) : (
        <Card className="w-80 max-h-96 overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex justify-between items-center">
              PWA Debug Info
              <Button size="sm" variant="ghost" onClick={() => setShowDebug(false)}>×</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            {Object.entries(debugInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className={value ? 'text-green-600' : 'text-red-600'}>
                  {String(value)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
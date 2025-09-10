// PWA utility functions

export function isPWAInstalled(): boolean {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // Check for iOS standalone mode
  if ((window.navigator as any).standalone) {
    return true
  }

  // Check for Android TWA
  if (document.referrer.includes('android-app://')) {
    return true
  }

  return false
}

export function canInstallPWA(): boolean {
  // Check if browser supports PWA installation
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isAndroidDevice(): boolean {
  return /Android/.test(navigator.userAgent)
}

export async function registerServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })
    
    console.log('Service Worker registered successfully:', registration)
    return true
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return false
  }
}

export function showInstallInstructions(device: 'ios' | 'android' | 'desktop') {
  const instructions = {
    ios: 'To install:\n1. Tap the Share button (↗)\n2. Select "Add to Home Screen"\n3. Tap "Add"',
    android: 'To install:\n1. Tap the menu (⋮)\n2. Select "Add to Home Screen"\n3. Tap "Add"',
    desktop: 'To install:\n1. Click the install icon in the address bar\n2. Click "Install"'
  }
  
  alert(instructions[device])
}
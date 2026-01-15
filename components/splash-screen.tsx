"use client"

import { useEffect } from "react"
import Image from "next/image"

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const splashElement = document.getElementById("splash-container")
      if (splashElement) {
        splashElement.style.opacity = "0"
        splashElement.style.transition = "opacity 0.5s ease-out"
        setTimeout(() => {
          onComplete()
        }, 500)
      } else {
        onComplete()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div id="splash-container" className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      <Image src="/splash-screen.svg" alt="Splash Screen" fill className="object-contain" priority />
    </div>
  )
}

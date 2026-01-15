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
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const videoUrl =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%91%E1%85%B3%E1%86%AF%E1%84%85%E1%85%A2%E1%84%89%E1%85%B5_%E1%84%8B%E1%85%A7%E1%86%BC%E1%84%89%E1%85%A1%E1%86%BC-d3tCKUpiEWgW9LEOyiU8NjH8WaAjlA.mp4"

  return (
    <div
      id="splash-container"
      className="fixed inset-0 z-[9999] flex flex-col items-center"
      style={{ backgroundColor: "#FCFAF9" }}
    >
      {/* Top section - Text and Logo */}
      <div className="flex flex-col items-center gap-6 mt-16">
        {/* Tagline */}
        <div className="text-center">
          <p className="text-[#666666] text-base">깜빡하는 건 그만!</p>
          <p className="text-[#666666] text-base">5초 만에 끝내는 할 일</p>
        </div>

        {/* Logo */}
        <Image src="/splash-logo.svg" alt="아마따 로고" width={180} height={97} priority />
      </div>

      {/* Video section - fills remaining space */}
      <div className="flex-1 w-full relative">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover object-top">
          <source src={videoUrl} type="video/mp4" />
        </video>

        {/* Bottom section - Kakao Corp overlaid on video */}
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#999999] text-sm z-10">kakao corp.</p>
      </div>
    </div>
  )
}

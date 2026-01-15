"use client"

import { useState } from "react"
import TodoList from "@/components/todo-list"
import { SplashScreen } from "@/components/splash-screen"
import { KakaoChat } from "@/components/kakao-chat"
import { KananaNotification } from "@/components/kanana-notification"

type AppScreen = "chat" | "splash" | "home"

export default function HomePage() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("chat")
  const [showNotification, setShowNotification] = useState(false)

  const handleNotificationClick = () => {
    setShowNotification(false)
    setCurrentScreen("splash")
  }

  const handleSplashComplete = () => {
    setCurrentScreen("home")
  }

  const handleShowNotification = () => {
    setShowNotification(true)
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      {currentScreen === "chat" && (
        <>
          <KakaoChat onShowNotification={handleShowNotification} />
          {showNotification && <KananaNotification onClose={handleNotificationClick} />}
        </>
      )}
      {currentScreen === "splash" && <SplashScreen onComplete={handleSplashComplete} />}
      {currentScreen === "home" && <TodoList />}
    </main>
  )
}

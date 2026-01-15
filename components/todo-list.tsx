"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronRight, Check, X } from "lucide-react"

interface Todo {
  id: number
  title: string
  url: string
  description?: string
  imageUrl?: string
  completed?: boolean
}

interface ApiTodoResponse {
  id: number
  task: string
  discription: string
  link: string
  userId: number
  imageUrl?: string
}

interface RecommendResponse {
  task: string
  description: string
  link: string
  category: string
  price: number
  imageUrl?: string
}

type SearchState = "idle" | "searching" | "found"

interface SearchResult {
  title: string
  url: string
  description: string
  imageUrl?: string
  category: string
  price: number
  taskOnly?: boolean
}

interface Message {
  text: string
  type: "user" | "system"
}

const API_BASE_URL = "https://amatta-api.goalmate.site"
const USER_ID = 1

export default function TodoList() {
  const [activeTodos, setActiveTodos] = useState<Todo[]>([])
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active")
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inputText, setInputText] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [showToast, setShowToast] = useState(false)

  const [viewportHeight, setViewportHeight] = useState("100%")

  const suggestions = [
    { emoji: "💊", text: "고려 은단 5만원어치" },
    { emoji: "🛍️", text: "전기장판 작은 거" },
    { emoji: "👚", text: "허리 안 조이는 잠옷 바지" },
  ]

  const [searchState, setSearchState] = useState<SearchState>("idle")
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [dotCount, setDotCount] = useState(1)

  useEffect(() => {
    async function fetchTodos() {
      try {
        const [activeTodosResponse, completedTodosResponse] = await Promise.all([
          fetch(`/api/todos?userId=${USER_ID}&type=uncompletion`),
          fetch(`/api/todos?userId=${USER_ID}&type=completion`),
        ])

        const activeData: ApiTodoResponse[] = await activeTodosResponse.json()
        const completedData: ApiTodoResponse[] = await completedTodosResponse.json()

        console.log("[v0] Active todos API response:", activeData)
        console.log("[v0] Completed todos API response:", completedData)

        const mappedActiveTodos: Todo[] = activeData.map((item) => ({
          id: item.id,
          title: item.task,
          url: item.link,
          description: item.discription,
          imageUrl: item.imageUrl,
        }))

        console.log("[v0] Mapped active todos:", mappedActiveTodos)

        const mappedCompletedTodos: Todo[] = completedData.map((item) => ({
          id: item.id,
          title: item.task,
          url: item.link,
          description: item.discription,
          imageUrl: item.imageUrl,
          completed: true,
        }))

        setActiveTodos(mappedActiveTodos)
        setCompletedTodos(mappedCompletedTodos)
      } catch (error) {
        console.error("[v0] Failed to fetch todos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodos()
  }, [])

  useEffect(() => {
    if (!isModalOpen || typeof window === "undefined" || !window.visualViewport) return

    const handleResize = () => {
      setViewportHeight(`${window.visualViewport!.height}px`)
    }

    window.visualViewport.addEventListener("resize", handleResize)
    window.visualViewport.addEventListener("scroll", handleResize)

    handleResize()

    return () => {
      window.visualViewport!.removeEventListener("resize", handleResize)
      window.visualViewport!.removeEventListener("scroll", handleResize)
    }
  }, [isModalOpen])

  useEffect(() => {
    if (searchState !== "searching") return

    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1)
    }, 500)

    return () => clearInterval(interval)
  }, [searchState])

  const handleCheckboxClick = async (todoId: number) => {
    if (activeTab === "active") {
      setRemovingId(todoId)

      try {
        const response = await fetch(`/api/todos?id=${todoId}`, {
          method: "PATCH",
        })

        if (!response.ok) {
          throw new Error("Failed to complete todo")
        }

        setTimeout(async () => {
          setActiveTodos((prev) => prev.filter((todo) => todo.id !== todoId))
          setRemovingId(null)

          try {
            const completedResponse = await fetch(`/api/todos?userId=${USER_ID}&type=completion`)
            const completedData: ApiTodoResponse[] = await completedResponse.json()
            const mappedCompletedTodos: Todo[] = completedData.map((item) => ({
              id: item.id,
              title: item.task,
              url: item.link,
              description: item.discription,
              imageUrl: item.imageUrl,
              completed: true,
            }))

            setCompletedTodos(mappedCompletedTodos)
          } catch (error) {
            console.error("[v0] Failed to refresh completed todos:", error)
          }
        }, 300)
      } catch (error) {
        console.error("[v0] Failed to complete todo:", error)
        setRemovingId(null)
      }
    } else {
      setRemovingId(todoId)
      setTimeout(() => {
        setCompletedTodos((prev) => prev.filter((todo) => todo.id !== todoId))
        setRemovingId(null)
      }, 300)
    }
  }

  const handleSuggestionClick = (text: string) => {
    setInputText(text)
  }

  const handleSend = async () => {
    if (inputText.trim()) {
      const userMessage = inputText.trim()
      setMessages((prev) => [...prev, { text: userMessage, type: "user" }])
      setInputText("")
      setSearchState("searching")
      setDotCount(1)

      try {
        const response = await fetch(`/api/todos?userId=1&userInput=${encodeURIComponent(userMessage)}`)

        if (response.status === 400) {
          setMessages((prev) => [...prev, { text: "도와드리기 어려운 요청이에요🙏", type: "system" }])
          setSearchState("idle")
          return
        }

        if (response.status === 404) {
          setMessages((prev) => [...prev, { text: "검색 결과가 없습니다", type: "system" }])
          setSearchState("idle")
          return
        }

        if (!response.ok) {
          throw new Error("API request failed")
        }

        const data: RecommendResponse = await response.json()

        if (!data.link || !data.description) {
          setSearchResult({
            title: data.task,
            url: "",
            description: "",
            imageUrl: "",
            category: data.category || "",
            price: 0,
            taskOnly: true,
          })
        } else {
          setSearchResult({
            title: data.task,
            url: data.link,
            description: data.description,
            imageUrl: data.imageUrl,
            category: data.category,
            price: data.price,
            taskOnly: false,
          })
        }
        setSearchState("found")
      } catch (error) {
        console.error("[v0] Failed to fetch recommendation:", error)
        setSearchState("idle")
      }
    }
  }

  const handleRetry = async () => {
    setSearchState("searching")
    setDotCount(1)

    const lastUserMessage = [...messages].reverse().find((m) => m.type === "user")
    if (lastUserMessage && searchResult) {
      try {
        if (!searchResult.taskOnly) {
          await fetch("/api/todos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: 1,
              category: searchResult.category,
              link: searchResult.url,
            }),
          })
        }

        const response = await fetch(`/api/todos?userId=1&userInput=${encodeURIComponent(lastUserMessage.text)}`)

        if (response.status === 400) {
          setMessages((prev) => [...prev, { text: "도와드리기 어려운 요청이에요🙏", type: "system" }])
          setSearchState("idle")
          return
        }

        if (response.status === 404) {
          setMessages((prev) => [...prev, { text: "검색 결과가 없습니다", type: "system" }])
          setSearchState("idle")
          return
        }

        if (!response.ok) {
          throw new Error("API request failed")
        }

        const data: RecommendResponse = await response.json()

        if (!data.link || !data.description) {
          setSearchResult({
            title: data.task,
            url: "",
            description: "",
            imageUrl: "",
            category: data.category || "",
            price: 0,
            taskOnly: true,
          })
        } else {
          setSearchResult({
            title: data.task,
            url: data.link,
            description: data.description,
            imageUrl: data.imageUrl,
            category: data.category,
            price: data.price,
            taskOnly: false,
          })
        }
        setSearchState("found")
      } catch (error) {
        console.error("[v0] Failed to fetch recommendation:", error)
        setSearchState("idle")
      }
    }
  }

  const handleAddTodo = async () => {
    if (searchResult) {
      try {
        const requestBody = searchResult.taskOnly
          ? {
              action: "add",
              task: searchResult.title,
              userId: 1,
            }
          : {
              action: "add",
              task: searchResult.title,
              link: searchResult.url,
              discription: searchResult.description,
              userId: 1,
              imageUrl: searchResult.imageUrl,
            }

        await fetch("/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        setIsModalOpen(false)
        setInputText("")
        setMessages([])
        setSearchState("idle")
        setSearchResult(null)

        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)

        const todosResponse = await fetch("/api/todos?userId=1&type=uncompletion")
        if (todosResponse.ok) {
          const data: ApiTodoResponse[] = await todosResponse.json()
          const mappedTodos: Todo[] = data.map((item) => ({
            id: item.id,
            title: item.task,
            url: item.link,
            description: item.discription,
            imageUrl: item.imageUrl,
          }))

          setActiveTodos(mappedTodos)
        }
      } catch (error) {
        console.error("[v0] Failed to add todos:", error)
      }
    }
  }

  return (
    <div className="mx-auto max-w-md min-h-screen flex flex-col" style={{ backgroundColor: "#F3F4F5" }}>
      {showToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full animate-in fade-in slide-in-from-top-2 duration-300"
          style={{ backgroundColor: "#7B7B7D" }}
        >
          <span className="text-white font-medium text-sm whitespace-nowrap">할 일 추가 완료!</span>
        </div>
      )}

      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: "#F3F4F5" }}>
        <Image src="/amatta-logo.svg" alt="아마따" width={71} height={38} className="h-9 w-auto" />
        <div className="flex items-center gap-3 font-bold" style={{ fontSize: "18px" }}>
          <button className="text-gray-700 hover:text-gray-900">설정</button>
          <button className="text-gray-700 hover:text-gray-900 relative">
            알림
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      <div className="relative flex border-b" style={{ backgroundColor: "#F3F4F5" }}>
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-4 font-bold relative transition-colors duration-200 ${activeTab === "active" ? "text-gray-900" : "text-gray-400"}`}
          style={{ fontSize: "19px" }}
        >
          할 일 {activeTodos.length}개
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 py-4 font-bold relative transition-colors duration-200 ${activeTab === "completed" ? "text-gray-900" : "text-gray-400"}`}
          style={{ fontSize: "19px" }}
        >
          끝낸 일 {completedTodos.length}개
        </button>
        <div
          className="absolute bottom-0 h-0.5 bg-gray-900 transition-all duration-300 ease-in-out"
          style={{
            width: "50%",
            left: activeTab === "active" ? "0%" : "50%",
          }}
        />
      </div>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-3 pb-24 animate-in fade-in duration-200">
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : activeTab === "active" && activeTodos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">할 일이 없습니다</div>
        ) : activeTab === "completed" && completedTodos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">끝낸 일이 없습니다</div>
        ) : (
          (activeTab === "active" ? activeTodos : completedTodos).map((todo) => {
            const isCompleted = activeTab === "completed"
            const isRemoving = removingId === todo.id

            return (
              <div
                key={todo.id}
                className={`border border-gray-200 rounded-2xl p-4 shadow-sm transition-all duration-300 ${
                  isRemoving ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
                style={{ backgroundColor: isCompleted ? "#E9ECEF" : "white" }}
              >
                <div className="flex items-start gap-3">
                  <button onClick={() => handleCheckboxClick(todo.id)} className="flex-shrink-0 mt-1">
                    <div
                      className="w-6 h-6 rounded-md border-2 flex items-center justify-center"
                      style={{
                        borderColor: isCompleted ? "#369BFD" : "#D6D6D7",
                        backgroundColor: isCompleted ? "#369BFD" : "transparent",
                      }}
                    >
                      <Check className="w-4 h-4" style={{ color: isCompleted ? "white" : "#D6D6D7" }} strokeWidth={3} />
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{todo.title}</h3>

                        {!isCompleted && todo.url && (
                          <a
                            href={todo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 hover:bg-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap w-fit"
                            style={{ backgroundColor: isCompleted ? "white" : "#F3F4F5" }}
                          >
                            <div className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">N</span>
                            </div>
                            <span className="font-medium">추천 상품 바로가기</span>
                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                          </a>
                        )}
                      </div>

                      {todo.imageUrl && (
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={todo.imageUrl || "/placeholder.svg"}
                              alt={todo.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {todo.description && (
                  <div
                    className="relative rounded-2xl p-2 mt-3"
                    style={{
                      border: "2px solid transparent",
                      backgroundImage: "linear-gradient(white, white), linear-gradient(to right, #FFB1D5, #FFAA97)",
                      backgroundOrigin: "border-box",
                      backgroundClip: "padding-box, border-box",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Image src="/kanana-icon.svg" alt="kanana" width={16} height={16} className="flex-shrink-0" />
                      <span className="text-gray-900 text-sm truncate">{todo.description}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-white hover:bg-gray-50 text-gray-900 rounded-full shadow-lg px-5 py-3 flex items-center gap-2 z-50 transition-all"
        style={{
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Image src="/todo-add-icon.svg" alt="할 일 추가" width={24} height={24} />
        <span className="font-semibold text-base whitespace-nowrap">할 일 추가하기</span>
      </button>

      <div className="h-20 pointer-events-none" />

      {isModalOpen && (
        <div
          className="fixed top-0 left-0 w-full z-50 flex flex-col overflow-hidden"
          style={{
            backgroundColor: "#F3F4F5",
            height: viewportHeight,
          }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ backgroundColor: "rgba(24, 12, 28, 0.05)" }}
          />
          <div className="relative flex flex-col max-w-md mx-auto w-full h-full">
            <header className="flex items-center justify-between px-4 py-3 relative flex-shrink-0">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setInputText("")
                  setMessages([])
                  setSearchState("idle")
                  setSearchResult(null)
                }}
                className="flex items-center gap-1 font-bold"
                style={{ color: "#4A4A4C" }}
              >
                <X className="w-5 h-5" />
                <span>닫기</span>
              </button>
              <button className="font-bold" style={{ color: "#4A4A4C" }}>
                내역
              </button>
            </header>

            <div className="flex-1 px-6 pt-8 overflow-auto">
              {messages.length === 0 && (
                <>
                  <div className="mb-6">
                    <Image
                      src="/todo-character.svg"
                      alt="캐릭터"
                      width={130}
                      height={101}
                      className="w-[130px] h-auto"
                    />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1">해야 할 것을 적으면 </h1>
                  <p className="text-xl font-bold text-gray-900 mb-6">맞춤형으로 추천해드릴게요!</p>

                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm"
                        style={{ backgroundColor: "#F0F8FF", color: "#1D8FFF" }}
                      >
                        <span>{suggestion.emoji}</span>
                        <span>{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {messages.length > 0 && (
                <div className="flex flex-col gap-3">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className="px-4 py-2 rounded-2xl max-w-[80%]"
                        style={{ backgroundColor: msg.type === "user" ? "#E9ECEF" : "white" }}
                      >
                        <span className="text-sm" style={{ color: msg.type === "user" ? "#1F2937" : "#369BFD" }}>
                          {msg.text}
                        </span>
                      </div>
                    </div>
                  ))}

                  {searchState === "searching" && (
                    <div className="flex justify-start">
                      <div className="px-4 py-2 rounded-2xl" style={{ backgroundColor: "white" }}>
                        <span style={{ color: "#369BFD" }} className="font-medium text-sm">
                          찾는 중{".".repeat(dotCount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {searchState === "found" && searchResult && (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-start">
                        <div className="px-4 py-2 rounded-2xl" style={{ backgroundColor: "white" }}>
                          <span style={{ color: "#369BFD" }} className="font-medium text-sm">
                            찾기 완료!
                          </span>
                        </div>
                      </div>

                      {searchResult.taskOnly ? (
                        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: "white" }}>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">{searchResult.title}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={handleRetry}
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-sm font-medium transition-all active:scale-95 active:shadow-inner hover:shadow-md"
                              style={{ backgroundColor: "#EEEEEF" }}
                            >
                              <Image src="/retry-icon.svg" alt="다시" width={16} height={16} />
                              <span className="whitespace-nowrap">다시 추천받기</span>
                            </button>
                            <button
                              onClick={handleAddTodo}
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-sm font-medium transition-all active:scale-95 active:shadow-inner hover:shadow-lg"
                              style={{ backgroundColor: "#FFE200" }}
                            >
                              <Image src="/add-todo-icon.svg" alt="추가" width={16} height={16} />
                              <span className="whitespace-nowrap">할 일 추가하기</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: "white" }}>
                          <div className="flex gap-3">
                            <div className="flex-1 min-w-0 flex flex-col">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">{searchResult.title}</h3>

                              <a
                                href={searchResult.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 hover:bg-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap w-fit"
                                style={{ backgroundColor: "#F3F4F5" }}
                              >
                                <div className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">N</span>
                                </div>
                                <span className="font-medium">추천 상품 바로가기</span>
                                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                              </a>
                            </div>

                            {searchResult.imageUrl && (
                              <div className="flex-shrink-0">
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                                  <img
                                    src={searchResult.imageUrl || "/placeholder.svg"}
                                    alt={searchResult.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {searchResult.description && (
                            <div
                              className="relative rounded-2xl p-2 mt-3"
                              style={{
                                border: "2px solid transparent",
                                backgroundImage:
                                  "linear-gradient(white, white), linear-gradient(to right, #FFB1D5, #FFAA97)",
                                backgroundOrigin: "border-box",
                                backgroundClip: "padding-box, border-box",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Image
                                  src="/kanana-icon.svg"
                                  alt="kanana"
                                  width={16}
                                  height={16}
                                  className="flex-shrink-0"
                                />
                                <span className="text-gray-900 text-sm truncate">{searchResult.description}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={handleRetry}
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-sm font-medium transition-all active:scale-95 active:shadow-inner hover:shadow-md"
                              style={{ backgroundColor: "#EEEEEF" }}
                            >
                              <Image src="/retry-icon.svg" alt="다시" width={16} height={16} />
                              <span className="whitespace-nowrap">다시 추천받기</span>
                            </button>
                            <button
                              onClick={handleAddTodo}
                              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-sm font-medium transition-all active:scale-95 active:shadow-inner hover:shadow-lg"
                              style={{ backgroundColor: "#FFE200" }}
                            >
                              <Image src="/add-todo-icon.svg" alt="추가" width={16} height={16} />
                              <span className="whitespace-nowrap">할 일 추가하기</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="absolute bottom-[#FFFDF2] left-1/4 w-64 h-64 rounded-full opacity-70 pointer-events-none"
              style={{ backgroundColor: "#FFFDF2", filter: "blur(60px)" }}
            />
            <div
              className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-70 pointer-events-none"
              style={{ backgroundColor: "#F2FCFF", filter: "blur(60px)" }}
            />

            <div className="p-4 flex-shrink-0">
              <div
                className="relative rounded-3xl p-1"
                style={{
                  background: "linear-gradient(to right, #68E0F4, #2781FF)",
                }}
              >
                <div className="bg-white rounded-3xl flex items-center gap-2 px-4 py-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="사야할 것, 해야할 것 모두 적어보세요"
                    className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                    style={{ fontSize: "14px" }}
                  />
                  <button onClick={handleSend} className="flex-shrink-0">
                    <Image src="/send-button.svg" alt="전송" width={32} height={32} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

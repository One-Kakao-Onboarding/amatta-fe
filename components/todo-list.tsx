"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronRight, Check, X } from "lucide-react"

interface Todo {
  id: number
  title: string
  url: string
  description?: string
  ogImage?: string
  favicon?: string
  completed?: boolean
}

interface ApiTodoResponse {
  id: number
  task: string
  discription: string
  link: string
  userId: number
}

interface RecommendResponse {
  task: string
  description: string
  link: string
  category: string
  price: number
}

type SearchState = "idle" | "searching" | "found"

interface SearchResult {
  title: string
  url: string
  description: string
  ogImage: string
  favicon?: string
  category: string
  price: number
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
  const [messages, setMessages] = useState<string[]>([])
  const [showToast, setShowToast] = useState(false)

  // [수정] 모바일 키보드 대응을 위한 뷰포트 높이 상태
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

        const mappedActiveTodos: Todo[] = activeData.map((item) => ({
          id: item.id,
          title: item.task,
          url: item.link,
          description: item.discription,
        }))

        const mappedCompletedTodos: Todo[] = completedData.map((item) => ({
          id: item.id,
          title: item.task,
          url: item.link,
          description: item.discription,
          completed: true,
        }))

        const activeTodosWithImages = await fetchTodosWithDelay(mappedActiveTodos)
        const completedTodosWithImages = await fetchTodosWithDelay(mappedCompletedTodos)

        setActiveTodos(activeTodosWithImages)
        setCompletedTodos(completedTodosWithImages)
      } catch (error) {
        console.error("[v0] Failed to fetch todos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodos()
  }, [])

  // [수정] Visual Viewport 감지 로직 추가
  // 키보드가 올라오면 window.visualViewport.height가 줄어듭니다.
  // 이 높이를 모달에 적용하여 입력창이 키보드 바로 위에 붙게 만듭니다.
  useEffect(() => {
    if (!isModalOpen || typeof window === "undefined" || !window.visualViewport) return

    const handleResize = () => {
      setViewportHeight(`${window.visualViewport!.height}px`)
    }

    window.visualViewport.addEventListener("resize", handleResize)
    window.visualViewport.addEventListener("scroll", handleResize)

    // 초기 실행
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

  async function fetchMetaImages(url: string): Promise<{ ogImage?: string; favicon?: string }> {
    try {
      const response = await fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      return { ogImage: data.ogImage, favicon: data.favicon }
    } catch {
      return {}
    }
  }

  async function fetchTodosWithDelay(todos: Todo[]): Promise<Todo[]> {
    const result = []
    for (const todo of todos) {
      try {
        const images = await fetchMetaImages(todo.url)
        result.push({ ...todo, ...images })
      } catch {
        result.push(todo)
      }
      // Add 200ms delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    return result
  }

  const handleCheckboxClick = async (todoId: number) => {
    if (activeTab === "active") {
      // Mark as removing for animation
      setRemovingId(todoId)

      try {
        // Call API to mark todo as complete
        const response = await fetch(`/api/todos?id=${todoId}`, {
          method: "PATCH",
        })

        if (!response.ok) {
          throw new Error("Failed to complete todo")
        }

        // Wait for animation to finish
        setTimeout(async () => {
          // Remove from active todos
          setActiveTodos((prev) => prev.filter((todo) => todo.id !== todoId))
          setRemovingId(null)

          // Refresh completed todos to show the newly completed item
          try {
            const completedResponse = await fetch(`/api/todos?userId=${USER_ID}&type=completion`)
            const completedData: ApiTodoResponse[] = await completedResponse.json()
            const mappedCompletedTodos: Todo[] = completedData.map((item) => ({
              id: item.id,
              title: item.task,
              url: item.link,
              description: item.discription,
              completed: true,
            }))

            const completedTodosWithImages = await fetchTodosWithDelay(mappedCompletedTodos)

            setCompletedTodos(completedTodosWithImages)
          } catch (error) {
            console.error("[v0] Failed to refresh completed todos:", error)
          }
        }, 300)
      } catch (error) {
        console.error("[v0] Failed to complete todo:", error)
        // Remove from removing state on error
        setRemovingId(null)
      }
    } else {
      // For completed todos, just remove with animation (no API call needed)
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
      setMessages((prev) => [...prev, userMessage])
      setInputText("")
      setSearchState("searching")
      setDotCount(1)

      try {
        const response = await fetch(`/api/todos?userId=1&userInput=${encodeURIComponent(userMessage)}`)

        if (!response.ok) {
          throw new Error("API request failed")
        }

        const data: RecommendResponse = await response.json()

        // Fetch og:image and favicon for the link
        const images = await fetchMetaImages(data.link)

        setSearchResult({
          title: data.task,
          url: data.link,
          description: data.description,
          ogImage: images.ogImage,
          favicon: images.favicon,
          category: data.category,
          price: data.price,
        })
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

    const lastMessage = messages[messages.length - 1]
    if (lastMessage && searchResult) {
      try {
        // Step 1: Exclude current product
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

        // Step 2: Get new recommendation
        const response = await fetch(`/api/todos?userId=1&userInput=${encodeURIComponent(lastMessage)}`)

        if (!response.ok) {
          throw new Error("API request failed")
        }

        const data: RecommendResponse = await response.json()

        // Fetch og:image and favicon for the link
        const images = await fetchMetaImages(data.link)

        setSearchResult({
          title: data.task,
          url: data.link,
          description: data.description,
          ogImage: images.ogImage,
          favicon: images.favicon,
          category: data.category,
          price: data.price,
        })
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
        // Add single product to server
        await fetch("/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add",
            task: searchResult.title,
            link: searchResult.url,
            discription: searchResult.description,
            userId: 1,
          }),
        })

        // Close modal and reset states
        setIsModalOpen(false)
        setInputText("")
        setMessages([])
        setSearchState("idle")
        setSearchResult(null)

        // Show toast
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)

        // Refresh todos list
        const todosResponse = await fetch("/api/todos?userId=1&type=uncompletion")
        if (todosResponse.ok) {
          const data: ApiTodoResponse[] = await todosResponse.json()
          const mappedTodos: Todo[] = data.map((item) => ({
            id: item.id,
            title: item.task,
            url: item.link,
            description: item.discription,
          }))

          const todosWithImages = await fetchTodosWithDelay(mappedTodos)

          setActiveTodos(todosWithImages)
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

                        <a
                          href={todo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 hover:bg-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap w-fit"
                          style={{ backgroundColor: isCompleted ? "white" : "#F3F4F5" }}
                        >
                          {todo.favicon ? (
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                              <img
                                src={todo.favicon || "/placeholder.svg"}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">N</span>
                            </div>
                          )}
                          <span className="font-medium">추천 상품 바로가기</span>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        </a>
                      </div>

                      {todo.ogImage && (
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={todo.ogImage || "/placeholder.svg"}
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
                  <h1 className="text-xl font-bold text-gray-900 mb-1">해야 할 것을 적으면</h1>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">맞춤형으로 추천해드릴게요!</h2>
                  <div className="flex flex-col gap-3 pb-4">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-full font-medium shadow-sm hover:opacity-90 transition-opacity w-fit"
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
                <div className="flex flex-col gap-3 pb-4">
                  {messages.map((message, index) => (
                    <div key={index} className="flex justify-end">
                      <div className="px-4 py-3 rounded-2xl max-w-[80%]" style={{ backgroundColor: "#E9ECEF" }}>
                        <span className="text-gray-900">{message}</span>
                      </div>
                    </div>
                  ))}

                  {searchState === "searching" && (
                    <div className="flex justify-start">
                      <div className="px-4 py-2 rounded-full bg-white shadow-sm">
                        <span className="font-medium" style={{ color: "#369BFD" }}>
                          찾는 중{".".repeat(dotCount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {searchState === "found" && searchResult && (
                    <>
                      <div className="flex justify-start">
                        <div className="px-4 py-2 rounded-full bg-white shadow-sm">
                          <span className="font-medium" style={{ color: "#369BFD" }}>
                            찾기 완료!
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mt-2">
                        <div className="flex gap-3">
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{searchResult.title}</h3>

                            <a
                              href={searchResult.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 hover:bg-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap w-fit"
                              style={{ backgroundColor: "#F3F4F5" }}
                            >
                              {searchResult.favicon ? (
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                                  <img
                                    src={searchResult.favicon || "/placeholder.svg"}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">N</span>
                                </div>
                              )}
                              <span className="font-medium">추천 상품 바로가기</span>
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            </a>
                          </div>

                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={searchResult.ogImage || "/placeholder.svg"}
                                alt={searchResult.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>

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

                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleRetry}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full transition-all whitespace-nowrap active:scale-95 active:shadow-inner hover:shadow-md cursor-pointer"
                            style={{ backgroundColor: "#EEEEEF" }}
                          >
                            <Image src="/retry-icon.svg" alt="다시" width={16} height={16} />
                            <span className="font-medium text-gray-700 text-sm">다시 추천받기</span>
                          </button>

                          <button
                            onClick={handleAddTodo}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full shadow-sm transition-all whitespace-nowrap active:scale-95 active:shadow-inner hover:shadow-lg cursor-pointer"
                            style={{ backgroundColor: "#FFE200" }}
                          >
                            <Image src="/add-todo-icon.svg" alt="추가" width={16} height={16} />
                            <span className="font-semibold text-gray-900 text-sm">할 일 추가하기</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-4 pb-6 pt-2">
              <div
                className="relative bg-white rounded-2xl shadow-lg overflow-hidden"
                style={{
                  border: "2px solid transparent",
                  backgroundImage: "linear-gradient(white, white), linear-gradient(to right, #68E0F4, #2781FF)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                }}
              >
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="사야할 것, 해야할 것 모두 적어보세요"
                  className="w-full p-4 pr-16 min-h-[80px] resize-none border-none outline-none text-gray-900 placeholder:text-gray-400"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  className="absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center transition-opacity hover:opacity-90"
                >
                  <Image src="/send-button.svg" alt="전송" width={48} height={48} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

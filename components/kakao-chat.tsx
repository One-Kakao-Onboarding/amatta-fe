"use client"

import { useState } from "react"
import Image from "next/image"

interface Message {
  id: number
  sender: string
  text: string
  time: string
  isOwn: boolean
  profile?: string
}

export function KakaoChat({ onShowNotification }: { onShowNotification: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "김회장",
      text: "요즘 산에 바람이 차네요\n내복 안 입으면 안되겄어",
      time: "오후 7:13",
      isOwn: false,
      profile:
        "/images/e1-84-80-e1-85-b5-e1-86-b7-e1-84-92-e1-85-ac-e1-84-8c-e1-85-a1-e1-86-bc-e1-84-91-e1-85-b3-e1-84-89-e1-85-a1.png",
    },
    {
      id: 2,
      sender: "박여사",
      text: "맞아유 나 어제 내복 하나 샀어요. 얇은데 따뜻하네",
      time: "오후 7:25",
      isOwn: false,
      profile:
        "/images/e1-84-87-e1-85-a1-e1-86-a8-e1-84-8b-e1-85-a7-e1-84-89-e1-85-a1-e1-84-91-e1-85-b3-e1-84-89-e1-85-a1.png",
    },
    {
      id: 3,
      sender: "나",
      text: "나도 내복 하나 사야하는데 ㅠ\n어디서 샀어요?",
      time: "오후 7:40",
      isOwn: true,
    },
    {
      id: 4,
      sender: "박여사",
      text: "그냥 젊은 애들 많이 산거요\n후기 좋다길래",
      time: "오후 7:41",
      isOwn: false,
      profile:
        "/images/e1-84-87-e1-85-a1-e1-86-a8-e1-84-8b-e1-85-a7-e1-84-89-e1-85-a1-e1-84-91-e1-85-b3-e1-84-89-e1-85-a1.png",
    },
    {
      id: 5,
      sender: "정선생",
      text: "이번 겨울은 전기장판 사야되는거 아니야?",
      time: "오후 7:43",
      isOwn: false,
      profile:
        "/images/e1-84-8c-e1-85-a5-e1-86-bc-e1-84-89-e1-85-a5-e1-86-ab-e1-84-89-e1-85-a2-e1-86-bc-e1-84-91-e1-85-b3-e1-84-89-e1-85-a1.png",
    },
    {
      id: 6,
      sender: "나",
      text: "맞아 며느리 전기장판 하나 보내줄까? 전자파 안나오는 걸로~^^",
      time: "오후 7:45",
      isOwn: true,
    },
    {
      id: 7,
      sender: "이아저씨",
      text: "나는 그냥 집에서 입을 니트 하나 샀어",
      time: "오후 7:50",
      isOwn: false,
      profile:
        "/images/e1-84-8b-e1-85-b5-e1-84-8b-e1-85-a1-e1-84-8c-e1-85-a5-e1-84-8a-e1-85-b5-e1-84-91-e1-85-b3-e1-84-89-e1-85-a1.png",
    },
  ])

  const [inputText, setInputText] = useState("")

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: "나",
        text: inputText,
        time: "오후 9:13",
        isOwn: true,
      }
      setMessages([...messages, newMessage])
      setInputText("")

      // Show notification after sending message
      setTimeout(() => {
        onShowNotification()
      }, 500)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#A6C2D3E5]">
      {/* Header */}
      <div className="bg-[#A6C2D3E5] pt-3 pb-2 px-4 flex items-center justify-between border-b border-[#9FB5C7]">
        <div className="w-6" />
        <h1 className="text-[17px] font-semibold text-[#191919]">관악 주민 산악회 7</h1>
        <div className="w-6" />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 ${message.isOwn ? "flex-row-reverse" : "flex-row"}`}>
            {!message.isOwn && message.profile && (
              <Image
                src={message.profile || "/placeholder.svg"}
                alt={message.sender}
                width={32}
                height={32}
                className="rounded-full flex-shrink-0 object-cover w-8 h-8"
              />
            )}
            <div className={`flex flex-col ${message.isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
              {!message.isOwn && <div className="text-[11px] text-[#191919] mb-1 ml-1">{message.sender}</div>}
              <div className="flex items-end gap-1">
                {message.isOwn && (
                  <span className="text-[11px] text-[#191919] opacity-70 whitespace-nowrap">{message.time}</span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl whitespace-pre-wrap ${
                    message.isOwn ? "bg-[#FFD129] rounded-br-sm" : "bg-white rounded-bl-sm"
                  }`}
                >
                  <p className="text-[14px] text-[#191919] leading-relaxed">{message.text}</p>
                </div>
                {!message.isOwn && (
                  <span className="text-[11px] text-[#191919] opacity-70 whitespace-nowrap">{message.time}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-gray-200">
        <button className="w-7 h-7 flex items-center justify-center">
          <Image src="/plus-icon.svg" alt="Plus" width={28} height={28} />
        </button>
        <div className="flex-1 bg-[#F5F5F5] rounded-full px-4 py-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="메시지 입력"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage()
              }
            }}
            className="flex-1 bg-transparent outline-none text-[14px] text-[#191919]"
          />
        </div>
        <button className="w-7 h-7 flex items-center justify-center">
          <Image src="/emoticon-icon.svg" alt="Emoticon" width={28} height={28} />
        </button>
        {inputText.trim() ? (
          <button className="w-7 h-7 flex items-center justify-center" onClick={handleSendMessage}>
            <Image src="/images/send-button.png" alt="Send" width={28} height={28} />
          </button>
        ) : (
          <button className="w-7 h-7 flex items-center justify-center">
            <Image
              src="/images/e1-84-89-e1-85-a3-e1-86-b8-e1-84-8b-e1-85-a1-e1-84-8b-e1-85-b5-e1-84-8f-e1-85-a9-e1-86-ab.png"
              alt="Shop"
              width={28}
              height={28}
            />
          </button>
        )}
      </div>
    </div>
  )
}

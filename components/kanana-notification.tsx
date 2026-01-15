"use client"

import Image from "next/image"

export function KananaNotification({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed top-[52px] left-4 right-4 z-50 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 cursor-pointer animate-in slide-in-from-top duration-300"
    >
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
        <Image src="/kanana-icon.svg" alt="Kanana" width={28} height={28} />
      </div>
      <p className="text-[13px] text-[#191919] leading-snug">
        후기 좋은 내복, 전기장판, 니트 보기 편하게 골라놨어요! 잊지 않게 할 일에 적어둘까요?
      </p>
    </div>
  )
}

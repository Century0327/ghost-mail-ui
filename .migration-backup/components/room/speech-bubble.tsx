'use client'

// 对话气泡：尖角在下方，猫咪"说话"时用。
export function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="animate-bubble-in relative w-max max-w-[15rem] origin-bottom">
      <div className="rounded-3xl border-2 border-border bg-card px-4 py-3 text-center font-cute text-base leading-relaxed text-card-foreground shadow-lg">
        {text}
      </div>
      {/* 尖角 */}
      <div className="absolute left-1/2 top-full -translate-x-1/2">
        <div className="size-0 border-x-[10px] border-t-[12px] border-x-transparent border-t-border" />
        <div className="absolute left-1/2 top-0 size-0 -translate-x-1/2 -translate-y-[3px] border-x-[7px] border-t-[9px] border-x-transparent border-t-card" />
      </div>
    </div>
  )
}

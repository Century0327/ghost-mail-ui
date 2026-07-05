
// 对话气泡：尖角在左下方，对准角色头部。
export function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="animate-bubble-in relative w-max max-w-[11rem] origin-bottom-left">
      <div className="rounded-2xl border-2 border-border bg-card px-3 py-2 font-cute text-xs leading-relaxed text-card-foreground shadow-lg">
        {text}
      </div>
      {/* 尖角 — 在左下方，对准角色 */}
      <div className="absolute left-4 top-full">
        <div className="size-0 border-x-[8px] border-t-[10px] border-x-transparent border-t-border" />
        <div className="absolute left-1/2 top-0 size-0 -translate-x-1/2 -translate-y-[3px] border-x-[5px] border-t-[7px] border-x-transparent border-t-card" />
      </div>
    </div>
  )
}

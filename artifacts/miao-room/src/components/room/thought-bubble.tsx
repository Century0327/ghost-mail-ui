

// 想法气泡：漫画式的圆圈连接（而不是尖角），点击可展开日程。
export function ThoughtBubble({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="animate-bubble-in group relative block w-max max-w-[13rem] origin-bottom cursor-pointer text-left"
      aria-label="查看想法与日程"
    >
      <div className="animate-float rounded-[1.75rem] border-2 border-border bg-card/95 px-4 py-3 font-cute text-sm leading-relaxed text-card-foreground shadow-lg transition-transform group-hover:scale-[1.03]">
        <span className="mr-1 text-primary">💭</span>
        {text}
      </div>
      {/* 连接的小圆圈（在气泡下方，逐渐变小） */}
      <div className="absolute left-6 top-full mt-1 flex flex-col items-center gap-1">
        <span className="block size-3 rounded-full border-2 border-border bg-card" />
        <span className="block size-2 rounded-full border-2 border-border bg-card" />
      </div>
    </button>
  )
}

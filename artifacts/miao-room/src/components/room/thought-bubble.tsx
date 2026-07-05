
// 想法气泡：漫画式的圆圈连接（而不是尖角），点击可展开日程。
export function ThoughtBubble({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="animate-bubble-in group relative block w-max max-w-[10rem] origin-bottom cursor-pointer text-left"
      aria-label="查看想法与日程"
    >
      <div className="animate-float rounded-[1.4rem] border-2 border-border bg-card/95 px-3 py-2 font-cute text-xs leading-relaxed text-card-foreground shadow-lg transition-transform group-hover:scale-[1.03]">
        <span className="mr-1 text-primary">💭</span>
        {text}
      </div>
      {/* 连接的小圆圈（在气泡下方，逐渐变小） */}
      <div className="absolute left-5 top-full mt-1 flex flex-col items-center gap-1">
        <span className="block size-2.5 rounded-full border-2 border-border bg-card" />
        <span className="block size-1.5 rounded-full border-2 border-border bg-card" />
      </div>
    </button>
  )
}

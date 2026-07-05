

import { useState, useMemo } from 'react'
import { Users, Search, Star, Check, Crown, Eye, Image, Upload, X } from 'lucide-react'
import { OFFICIAL_CHARACTERS, PUBLIC_CHARACTERS, PERSONALITY_TAGS, type Character } from '@/lib/companion-data'

type CharacterSelectorProps = {
  open: boolean
  onClose: () => void
  currentCharacterId: string | null
  onSelectCharacter: (character: Character) => void
  ownedCharacterIds: string[] // 已获得的角色ID列表
  onOpenCreator?: () => void
}

// 角色卡片
function CharacterCard({
  character,
  isOwned,
  isCurrent,
  onClick,
  onUnlock,
}: {
  character: Character
  isOwned: boolean
  isCurrent: boolean
  onClick: () => void
  onUnlock?: () => void
}) {
  const personalities = character.personalities
    .map((pId) => PERSONALITY_TAGS.find((p) => p.id === pId))
    .filter(Boolean)

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-all ${
        isCurrent
          ? 'border-primary bg-primary/10 shadow-md'
          : isOwned
            ? 'border-border bg-card hover:border-primary/50 hover:shadow-md'
            : 'border-border/50 bg-card/50 opacity-70 grayscale'
      }`}
    >
      {/* 选中标记 */}
      {isCurrent && (
        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}

      {/* 角色图片 */}
      <div
        className="relative mb-2 aspect-square overflow-hidden rounded-xl bg-secondary/30"
        style={{ opacity: isOwned ? 1 : 0.5 }}
      >
        <img
          src={character.image}
          alt={character.name}
          className="pixelated size-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
        {/* 官方标记 */}
        {character.isOfficial && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-400 p-1 text-[8px] text-amber-900">
            <Crown className="size-3" />
          </span>
        )}
        {/* 锁定状态 */}
        {!isOwned && !character.isOfficial && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/60">
            <span className="text-xs text-muted-foreground">未解锁</span>
          </div>
        )}
      </div>

      {/* 角色信息 */}
      <h3 className="font-cute text-base text-foreground line-clamp-1">{character.name}</h3>
      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{character.bio}</p>

      {/* 性格标签 */}
      <div className="mt-2 flex flex-wrap gap-1">
        {personalities.slice(0, 3).map((tag) => (
          <span
            key={tag!.id}
            className="rounded-full px-2 py-0.5 text-[9px] font-medium"
            style={{
              backgroundColor: `${tag!.color}20`,
              color: tag!.color,
            }}
          >
            {tag!.label}
          </span>
        ))}
      </div>
    </button>
  )
}

// 自定义角色创建器
function CharacterCreator({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (character: Partial<Character>) => void
}) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    image: '',
    name: '',
    bio: '',
    personalities: [] as string[],
    statName: '',
    isPublic: false,
    agreedTerms: false,
  })

  if (!open) return null

  const handleSubmit = () => {
    if (!formData.image || !formData.name || formData.personalities.length === 0 || !formData.agreedTerms) return
    onCreate({
      image: formData.image,
      name: formData.name,
      bio: formData.bio || '一只神秘的小可爱，等你来了解~',
      personalities: formData.personalities,
      statName: formData.statName || '好感度',
      isPublic: formData.isPublic,
      isOfficial: false,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-foreground/30 backdrop-blur-sm animate-in fade-in">
      <div
        className="mx-4 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-cute text-lg text-foreground">创建自定义角色</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>

        {/* 步骤指示 */}
        <div className="mb-4 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* 步骤1: 上传图片 */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="font-cute text-sm text-muted-foreground">上传角色图片（必填）</p>
            <div
              className="aspect-square rounded-2xl border-2 border-dashed border-border bg-secondary/20 p-4"
              style={{ backgroundImage: formData.image ? `url(${formData.image})` : undefined, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
            >
              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                {!formData.image && (
                  <>
                    <Upload className="size-8" />
                    <span className="text-sm">点击上传图片</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        setFormData((f) => ({ ...f, image: ev.target?.result as string }))
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </label>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!formData.image}
              className="w-full rounded-xl bg-primary py-2 font-cute text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
            >
              下一步
            </button>
          </div>
        )}

        {/* 步骤2: 基本信息 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block font-cute text-sm text-muted-foreground">角色名称（必填）</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="给角色起个可爱的名字吧"
                maxLength={12}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block font-cute text-sm text-muted-foreground">角色简介（选填）</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData((f) => ({ ...f, bio: e.target.value }))}
                placeholder="描述一下这个角色的性格或故事..."
                maxLength={100}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {!formData.bio && (
                <p className="mt-1 text-xs text-muted-foreground">不填将自动生成简介</p>
              )}
            </div>
            <div>
              <label className="mb-1 block font-cute text-sm text-muted-foreground">性格标签（必填，1-3个）</label>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_TAGS.map((tag) => {
                  const isSelected = formData.personalities.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setFormData((f) => ({
                          ...f,
                          personalities: isSelected
                            ? f.personalities.filter((p) => p !== tag.id)
                            : f.personalities.length < 3
                              ? [...f.personalities, tag.id]
                              : f.personalities,
                        }))
                      }}
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        isSelected ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        ['--tw-ring-color' as string]: tag.color,
                      }}
                    >
                      {tag.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="mb-1 block font-cute text-sm text-muted-foreground">数值名称（选填）</label>
              <input
                type="text"
                value={formData.statName}
                onChange={(e) => setFormData((f) => ({ ...f, statName: e.target.value }))}
                placeholder="如：哈气值、信任度、快乐值"
                maxLength={10}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">不填默认为"好感度"</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-border py-2 font-cute text-muted-foreground transition hover:bg-secondary"
              >
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.name || formData.personalities.length === 0}
                className="flex-1 rounded-xl bg-primary py-2 font-cute text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* 步骤3: 发布设置 */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="font-cute text-sm text-muted-foreground">发布设置</p>

            {/* 公开开关 */}
            <div
              className={`rounded-xl border p-4 transition ${
                formData.isPublic ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'
              }`}
            >
              <button
                onClick={() => setFormData((f) => ({ ...f, isPublic: !f.isPublic }))}
                className="flex w-full items-start gap-3 text-left"
              >
                <div className={`mt-0.5 size-5 shrink-0 rounded-full border-2 transition ${
                  formData.isPublic ? 'border-primary bg-primary' : 'border-border'
                }`}>
                  {formData.isPublic && <Check className="size-full p-0.5 text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="font-cute text-sm text-foreground">公开角色</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">其他用户可以看到并使用这个角色</p>
                </div>
              </button>
            </div>

            {/* 条款同意 */}
            {formData.isPublic && (
              <label className="flex items-start gap-2 rounded-xl border border-border p-3">
                <input
                  type="checkbox"
                  checked={formData.agreedTerms}
                  onChange={(e) => setFormData((f) => ({ ...f, agreedTerms: e.target.checked }))}
                  className="mt-0.5 size-4 rounded border-border"
                />
                <div className="flex-1 text-xs text-muted-foreground">
                  <p>我同意公开角色的相关条款，包括：</p>
                  <button className="mt-1 text-primary hover:underline" onClick={() => alert('显示完整条款弹窗')}>
                    查看完整条款
                  </button>
                </div>
              </label>
            )}

            {/* 预览 */}
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="mb-2 font-cute text-xs text-muted-foreground">预览</p>
              <div className="flex gap-3">
                <img src={formData.image} alt="" className="h-16 w-16 rounded-lg object-contain" />
                <div className="flex-1">
                  <p className="font-cute text-foreground">{formData.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {formData.bio || '一只神秘的小可爱，等你来了解~'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-border py-2 font-cute text-muted-foreground transition hover:bg-secondary"
              >
                上一步
              </button>
              <button
                onClick={handleSubmit}
                disabled={formData.isPublic && !formData.agreedTerms}
                className="flex-1 rounded-xl bg-primary py-2 font-cute text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
              >
                创建角色
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CharacterSelector({
  open,
  onClose,
  currentCharacterId,
  onSelectCharacter,
  ownedCharacterIds,
  onOpenCreator,
}: CharacterSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [creatorOpen, setCreatorOpen] = useState(false)

  // 搜索过滤
  const filteredOfficial = useMemo(() => {
    if (!searchQuery) return OFFICIAL_CHARACTERS
    const q = searchQuery.toLowerCase()
    return OFFICIAL_CHARACTERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const filteredPublic = useMemo(() => {
    if (!searchQuery) return PUBLIC_CHARACTERS
    const q = searchQuery.toLowerCase()
    return PUBLIC_CHARACTERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        (c.creatorName?.toLowerCase().includes(q) ?? false) ||
        (c.creatorId?.toLowerCase().includes(q) ?? false)
    )
  }, [searchQuery])

  // 已获得的角色（官方 + 公开）
  const ownedCharacters = [
    ...OFFICIAL_CHARACTERS.filter((c) => ownedCharacterIds.includes(c.id)),
    ...PUBLIC_CHARACTERS.filter((c) => ownedCharacterIds.includes(c.id) && c.isPublic),
  ]

  // 未获得的角色
  const unlockedCharacters = [
    ...OFFICIAL_CHARACTERS.filter((c) => !ownedCharacterIds.includes(c.id)),
    ...PUBLIC_CHARACTERS.filter((c) => !ownedCharacterIds.includes(c.id) && c.isPublic),
  ]

  // 创建自定义角色
  const handleCreateCharacter = (character: Partial<Character>) => {
    console.log('创建角色:', character)
    // TODO: 保存到数据库
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="max-h-[80dvh] w-full rounded-t-3xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-cute text-lg text-foreground">选择角色</h2>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* 搜索栏 */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索角色名称 / ID / 创建者"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* 内容区域 */}
          <div className="overflow-y-auto p-4 scrollbar-hide" style={{ maxHeight: 'calc(80dvh - 100px)' }}>
            {/* 已获得角色 */}
            {ownedCharacters.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 font-cute text-sm text-muted-foreground">
                  <Check className="size-4 text-primary" />
                  已获得
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ownedCharacters.map((char) => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      isOwned={true}
                      isCurrent={currentCharacterId === char.id}
                      onClick={() => onSelectCharacter(char)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 未获得角色 */}
            {unlockedCharacters.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 font-cute text-sm text-muted-foreground">
                  <Star className="size-4 text-amber-500" />
                  未获得
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {unlockedCharacters.map((char) => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      isOwned={false}
                      isCurrent={false}
                      onClick={() => {
                        // TODO: 解锁角色逻辑
                        alert('解锁该角色')
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 创建自定义角色按钮 */}
            <button
              onClick={() => {
                setCreatorOpen(true)
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 font-cute text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Upload className="size-4" />
              创建自定义角色
            </button>
          </div>
        </div>
      </div>

      {/* 角色创建器 */}
      <CharacterCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onCreate={handleCreateCharacter}
      />
    </>
  )
}

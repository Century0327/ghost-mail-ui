// 陪伴系统本地状态管理
// 所有动态游戏状态存 localStorage，后端只提供只读配置

const LS_KEY = 'ghost_companion_state'
const LS_SCHEDULE_HISTORY_KEY = 'ghost_schedule_history'

export interface CompanionState {
  deviceId: string
  characters: Record<string, CharacterLocalState>
  items: string[] // 拥有的物品 ID
  letters: Letter[]
  conversations: Conversation[]
  attachments: Attachment[]
  lastSync?: number
}

export interface CharacterLocalState {
  statValue: number
  mood: string
  stage: string
  position: { x: number; y: number }
  interactCount: number
  lastInteractAt: number
  schedule: ScheduleItem[]
}

export interface ScheduleItem {
  time: string
  activity: string
  location: string
  thought: string
  done?: boolean
  completedAt?: number
}

// 日程历史记录（按日期存储）
export interface ScheduleDay {
  date: string
  items: ScheduleItem[]
  summary: string
  generatedAt: number
}

export interface ScheduleHistory {
  characterId: string
  days: Record<string, ScheduleDay>
  currentSummary: string
  totalInteractCount: number
}

export interface Letter {
  id: string
  characterId: string
  subject: string
  body: string
  source: string
  attachmentUrl?: string
  createdAt: string
  isFavorite?: boolean
  isRead?: boolean
}

export interface Conversation {
  id: string
  characterId: string
  role: 'ghost' | 'user'
  sender?: string
  content: string
  createdAt: string
}

export interface Attachment {
  id: string
  letterId?: string
  characterId: string
  src: string
  title: string
  createdAt: string
}

// ==================== 工具函数 ====================

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function getNow(): number {
  return Date.now()
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// 时间比较：返回 -1 (t1 < t2), 0 (相等), 1 (t1 > t2)
function compareTime(t1: string, t2: string): number {
  const [h1, m1] = t1.split(':').map(Number)
  const [h2, m2] = t2.split(':').map(Number)
  if (h1 !== h2) return h1 < h2 ? -1 : 1
  if (m1 !== m2) return m1 < m2 ? -1 : 1
  return 0
}

// 判断日程状态
export type ScheduleStatus = 'past' | 'current' | 'future' | 'done'

export function getScheduleStatus(item: ScheduleItem, currentTime?: string): ScheduleStatus {
  if (item.done) return 'done'
  const now = currentTime || getCurrentTime()
  const cmp = compareTime(item.time, now)
  if (cmp < 0) return 'past'
  if (cmp === 0) return 'current'
  return 'future'
}

// 时间衰减：根据上次互动时间计算当前哈气值
function decayStat(lastInteractAt: number, currentValue: number): number {
  const hoursSince = (getNow() - lastInteractAt) / (1000 * 60 * 60)
  // 每小时衰减 2 点
  const decay = Math.floor(hoursSince * 2)
  return Math.max(0, currentValue - decay)
}

// ==================== 核心 API ====================

export const companionLocal = {
  // 获取完整状态
  getState(): CompanionState {
    if (typeof window === 'undefined') {
      return this.getDefaultState()
    }
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) {
      return this.getDefaultState()
    }
    try {
      const state = JSON.parse(raw) as CompanionState
      // 确保所有角色状态都有默认值
      return this.ensureDefaults(state)
    } catch {
      return this.getDefaultState()
    }
  },

  getDefaultState(): CompanionState {
    const deviceId =
      typeof window !== 'undefined'
        ? localStorage.getItem('ghost_device_id') || crypto.randomUUID()
        : 'server'
    if (typeof window !== 'undefined') {
      localStorage.setItem('ghost_device_id', deviceId)
    }
    return {
      deviceId,
      characters: {},
      items: ['cat_bed', 'carpet', 'lamp'],
      letters: [],
      conversations: [],
      attachments: [],
    }
  },

  ensureDefaults(state: CompanionState): CompanionState {
    const defaults = this.getDefaultState()
    return {
      ...defaults,
      ...state,
      characters: state.characters || {},
      items: state.items || defaults.items,
      letters: state.letters || [],
      conversations: state.conversations || [],
      attachments: state.attachments || [],
    }
  },

  saveState(state: CompanionState): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  },

  // ==================== 角色状态 ====================

  getCharacterState(characterId: string): CharacterLocalState {
    const state = this.getState()
    if (!state.characters[characterId]) {
      state.characters[characterId] = {
        statValue: 50,
        mood: '平静',
        stage: '二阶段',
        position: { x: 50, y: 60 },
        interactCount: 0,
        lastInteractAt: getNow(),
        schedule: [],
      }
      this.saveState(state)
    }
    const charState = state.characters[characterId]
    // 应用时间衰减
    charState.statValue = decayStat(charState.lastInteractAt, charState.statValue)
    return charState
  },

  interact(characterId: string, type: 'click' | 'drag' | 'double_click' = 'click'): CharacterLocalState {
    const state = this.getState()
    const charState = this.getCharacterState(characterId)

    const delta = type === 'double_click' ? 2 : 1
    charState.statValue = Math.min(100, charState.statValue + delta)
    charState.interactCount += 1
    charState.lastInteractAt = getNow()

    // 根据哈气值更新 mood
    if (charState.statValue > 80) charState.mood = '开心'
    else if (charState.statValue > 50) charState.mood = '平静'
    else if (charState.statValue > 20) charState.mood = '无聊'
    else charState.mood = '生气'

    state.characters[characterId] = charState
    this.saveState(state)

    // 同时更新日程历史的互动计数
    const history = this.getScheduleHistory(characterId)
    history.totalInteractCount += 1
    this.saveScheduleHistory(characterId, history)

    return charState
  },

  updatePosition(characterId: string, x: number, y: number): CharacterLocalState {
    const state = this.getState()
    const charState = this.getCharacterState(characterId)
    charState.position = { x, y }
    state.characters[characterId] = charState
    this.saveState(state)
    return charState
  },

  // ==================== 日程历史（长记忆）====================

  getScheduleHistory(characterId: string): ScheduleHistory {
    if (typeof window === 'undefined') {
      return { characterId, days: {}, currentSummary: '', totalInteractCount: 0 }
    }
    const raw = localStorage.getItem(`${LS_SCHEDULE_HISTORY_KEY}_${characterId}`)
    if (!raw) {
      return { characterId, days: {}, currentSummary: '', totalInteractCount: 0 }
    }
    try {
      return JSON.parse(raw) as ScheduleHistory
    } catch {
      return { characterId, days: {}, currentSummary: '', totalInteractCount: 0 }
    }
  },

  saveScheduleHistory(characterId: string, history: ScheduleHistory): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(`${LS_SCHEDULE_HISTORY_KEY}_${characterId}`, JSON.stringify(history))
  },

  // 获取今天的日程
  getTodaySchedule(characterId: string): ScheduleItem[] {
    const history = this.getScheduleHistory(characterId)
    const today = getToday()
    const todayRecord = history.days[today]
    if (todayRecord) {
      return todayRecord.items
    }
    // 如果没有今天的日程，返回角色状态中的日程（兼容旧数据）
    const charState = this.getCharacterState(characterId)
    return charState.schedule || []
  },

  // 保存今天的日程
  saveTodaySchedule(characterId: string, items: ScheduleItem[], summary: string): void {
    const history = this.getScheduleHistory(characterId)
    const today = getToday()
    history.days[today] = {
      date: today,
      items,
      summary,
      generatedAt: getNow(),
    }
    history.currentSummary = summary
    this.saveScheduleHistory(characterId, history)

    // 同时更新角色状态中的日程（兼容旧逻辑）
    const state = this.getState()
    const charState = this.getCharacterState(characterId)
    charState.schedule = items
    state.characters[characterId] = charState
    this.saveState(state)
  },

  // 获取昨天的日程和完成情况（用于 AI Prompt）
  getYesterdaySchedule(characterId: string): ScheduleDay | null {
    const history = this.getScheduleHistory(characterId)
    const dates = Object.keys(history.days).sort().reverse()
    if (dates.length >= 2) {
      return history.days[dates[1]]
    }
    return null
  },

  // 获取上次日程（最近一天）
  getLastSchedule(characterId: string): ScheduleDay | null {
    const history = this.getScheduleHistory(characterId)
    const dates = Object.keys(history.days).sort().reverse()
    if (dates.length > 0) {
      return history.days[dates[0]]
    }
    return null
  },

  // 计算日程完成率
  getScheduleCompletionRate(characterId: string): number {
    const history = this.getScheduleHistory(characterId)
    let total = 0
    let done = 0
    Object.values(history.days).forEach((day) => {
      total += day.items.length
      done += day.items.filter((i) => i.done).length
    })
    return total > 0 ? Math.round((done / total) * 100) : 0
  },

  // ==================== 日程交互 ====================

  toggleScheduleDone(characterId: string, time: string): ScheduleItem[] {
    const state = this.getState()
    const charState = this.getCharacterState(characterId)
    const item = charState.schedule.find((s) => s.time === time)
    if (item) {
      item.done = !item.done
      if (item.done) {
        item.completedAt = getNow()
      } else {
        delete item.completedAt
      }
      state.characters[characterId] = charState
      this.saveState(state)

      // 同步更新历史记录
      const history = this.getScheduleHistory(characterId)
      const today = getToday()
      if (history.days[today]) {
        const historyItem = history.days[today].items.find((i) => i.time === time)
        if (historyItem) {
          historyItem.done = item.done
          historyItem.completedAt = item.completedAt
          this.saveScheduleHistory(characterId, history)
        }
      }
    }
    return charState.schedule
  },

  // ==================== 信件 ====================

  addLetter(letter: Omit<Letter, 'id'>): Letter {
    const state = this.getState()
    const newLetter: Letter = { ...letter, id: generateId() }
    state.letters.unshift(newLetter)
    this.saveState(state)
    return newLetter
  },

  toggleFavorite(letterId: string): Letter | undefined {
    const state = this.getState()
    const letter = state.letters.find((l) => l.id === letterId)
    if (letter) {
      letter.isFavorite = !letter.isFavorite
      this.saveState(state)
    }
    return letter
  },

  getLetters(characterId?: string): Letter[] {
    const state = this.getState()
    if (characterId) {
      return state.letters.filter((l) => l.characterId === characterId)
    }
    return state.letters
  },

  // ==================== 附件 ====================

  addAttachment(attachment: Omit<Attachment, 'id'>): Attachment {
    const state = this.getState()
    const newAttachment: Attachment = { ...attachment, id: generateId() }
    state.attachments.unshift(newAttachment)
    this.saveState(state)
    return newAttachment
  },

  getAttachments(characterId?: string): Attachment[] {
    const state = this.getState()
    if (characterId) {
      return state.attachments.filter((a) => a.characterId === characterId)
    }
    return state.attachments
  },

  // ==================== 对话 ====================

  addConversation(conv: Omit<Conversation, 'id'>): Conversation {
    const state = this.getState()
    const newConv: Conversation = { ...conv, id: generateId() }
    state.conversations.unshift(newConv)
    this.saveState(state)
    return newConv
  },

  getConversations(characterId?: string): Conversation[] {
    const state = this.getState()
    if (characterId) {
      return state.conversations.filter((c) => c.characterId === characterId)
    }
    return state.conversations
  },

  // ==================== 物品 ====================

  getItems(): string[] {
    return this.getState().items
  },

  addItem(itemId: string): void {
    const state = this.getState()
    if (!state.items.includes(itemId)) {
      state.items.push(itemId)
      this.saveState(state)
    }
  },

  // ==================== 重置 ====================

  reset(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(LS_KEY)
    // 清除所有角色的日程历史
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(LS_SCHEDULE_HISTORY_KEY)) {
        localStorage.removeItem(key)
      }
    }
  },
}

export default companionLocal

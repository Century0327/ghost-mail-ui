// 陪伴系统本地状态管理
// 所有动态游戏状态存 localStorage，后端只提供只读配置

const LS_KEY = 'ghost_companion_state'

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

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function getNow(): number {
  return Date.now()
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
        schedule: [
          { time: '08:00', activity: '在窗台发呆', location: '窗台', thought: '太阳照在身上真舒服' },
          { time: '10:00', activity: '观察窗外风景', location: '窗台前', thought: '那些蝴蝶真好看' },
          { time: '14:00', activity: '在沙发上散步', location: '地毯上', thought: '地毯的触感很温暖' },
        ],
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

  // ==================== 日程 ====================

  toggleScheduleDone(characterId: string, time: string): ScheduleItem[] {
    const state = this.getState()
    const charState = this.getCharacterState(characterId)
    const item = charState.schedule.find((s) => s.time === time)
    if (item) {
      item.done = !item.done
      state.characters[characterId] = charState
      this.saveState(state)
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
  },
}

export default companionLocal

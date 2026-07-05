// 陪伴系统 API 调用层（本地优先版）
// 后端只提供只读配置（角色列表、物品列表），所有动态状态存 localStorage

import companionLocal from './companion-local'
import type { Letter, Conversation, Attachment } from './companion-local'

const API_BASE = '' // 使用相对路径，由 vercel.json rewrite 代理到后端

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem('ghost_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ghost_device_id', id)
  }
  return id
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ghost_auth_token')
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken()
  const deviceId = getDeviceId()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-ID': deviceId,
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export const companionApi = {
  // ========== 只读配置（后端提供） ==========

  getCharacters: () => apiFetch('/api/companion/characters'),
  getItems: () => apiFetch('/api/companion/items'),

  // ========== 动态状态（本地优先） ==========

  getCharacterStatus: (id: string) => {
    const localState = companionLocal.getCharacterState(id)
    return Promise.resolve({
      character: { id, name: '耄聋', personality: '深沉', statName: '哈气值', statColor: '#c9785c' },
      userState: {
        statValue: localState.statValue,
        stage: localState.stage,
        mood: localState.mood,
        position: localState.position,
        schedule: localState.schedule,
      },
    })
  },

  interact: (id: string, type: 'click' | 'drag' | 'double_click' = 'click') => {
    const newState = companionLocal.interact(id, type)
    return Promise.resolve({
      message: '互动已记录',
      characterId: id,
      type,
      statValue: newState.statValue,
      mood: newState.mood,
    })
  },

  updatePosition: (id: string, x: number, y: number) => {
    const newState = companionLocal.updatePosition(id, x, y)
    return Promise.resolve({
      message: '位置已更新',
      position: newState.position,
    })
  },

  getUserItems: () => Promise.resolve({ items: companionLocal.getItems() }),

  // ========== 信件（后端 API + 本地缓存） ==========

  getLetters: async (characterId?: string): Promise<{ letters: Letter[] }> => {
    try {
      const query = characterId ? `?character_id=${characterId}` : ''
      const result = await apiFetch(`/api/companion/letters${query}`)
      if (result.letters?.length) {
        const state = companionLocal.getState()
        const existingIds = new Set(state.letters.map((l) => l.id))
        for (const letter of result.letters) {
          if (!existingIds.has(letter.id)) {
            companionLocal.addLetter({
              characterId: letter.character_id || characterId || 'maodie',
              subject: letter.subject,
              body: letter.body,
              source: letter.source || 'ai',
              attachmentUrl: letter.attachment_url,
              createdAt: letter.created_at,
            })
          }
        }
      }
      return { letters: companionLocal.getLetters(characterId) }
    } catch {
      return { letters: companionLocal.getLetters(characterId) }
    }
  },

  createLetter: (data: {
    character_id: string
    subject: string
    body: string
    source?: string
    attachment_url?: string
  }) => {
    companionLocal.addLetter({
      characterId: data.character_id,
      subject: data.subject,
      body: data.body,
      source: data.source || 'ai',
      attachmentUrl: data.attachment_url,
      createdAt: new Date().toISOString(),
    })
    return Promise.resolve({ status: 'ok', message: 'Letter created locally' })
  },

  // ========== 对话（本地优先） ==========

  getConversations: async (characterId?: string): Promise<{ conversations: Conversation[] }> => {
    try {
      const query = characterId ? `?character_id=${characterId}` : ''
      const result = await apiFetch(`/api/companion/conversations${query}`)
      if (result.conversations?.length) {
        const state = companionLocal.getState()
        const existingIds = new Set(state.conversations.map((c) => c.id))
        for (const conv of result.conversations) {
          if (!existingIds.has(conv.id)) {
            companionLocal.addConversation({
              characterId: conv.character_id || characterId || 'maodie',
              role: conv.role || 'ghost',
              sender: conv.sender,
              content: conv.content,
              createdAt: conv.created_at,
            })
          }
        }
      }
      return { conversations: companionLocal.getConversations(characterId) }
    } catch {
      return { conversations: companionLocal.getConversations(characterId) }
    }
  },

  createConversation: (data: {
    character_id: string
    role: 'ghost' | 'user'
    sender?: string
    content: string
  }) => {
    companionLocal.addConversation({
      characterId: data.character_id,
      role: data.role,
      sender: data.sender,
      content: data.content,
      createdAt: new Date().toISOString(),
    })
    return Promise.resolve({ status: 'ok', message: 'Conversation recorded locally' })
  },

  // ========== 附件/相册（后端 API + 本地缓存） ==========

  getAttachments: async (characterId?: string): Promise<{ attachments: Attachment[] }> => {
    try {
      const query = characterId ? `?character_id=${characterId}` : ''
      const result = await apiFetch(`/api/companion/attachments${query}`)
      if (result.attachments?.length) {
        const state = companionLocal.getState()
        const existingIds = new Set(state.attachments.map((a) => a.id))
        for (const att of result.attachments) {
          if (!existingIds.has(att.id)) {
            companionLocal.addAttachment({
              letterId: att.letter_id,
              characterId: att.character_id || characterId || 'maodie',
              src: att.src,
              title: att.title,
              createdAt: att.created_at,
            })
          }
        }
      }
      return { attachments: companionLocal.getAttachments(characterId) }
    } catch {
      return { attachments: companionLocal.getAttachments(characterId) }
    }
  },

  // ========== AI 日程生成 ==========

  generateSchedule: (data: {
    character_id: string
    last_schedule?: any[]
    history_summary?: string
    interact_count?: number
  }) => apiFetch('/api/companion/generate-schedule', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 获取日程列表
  getSchedules: async (characterId?: string): Promise<{ schedules: any[] }> => {
    try {
      const query = characterId ? `?character_id=${characterId}` : ''
      const result = await apiFetch(`/api/companion/schedules${query}`)
      return { schedules: result.schedules || [] }
    } catch {
      return { schedules: companionLocal.getTodaySchedule(characterId || 'maodie') }
    }
  },

  // 刷新今日日程（调用AI生成）
  refreshSchedule: async (characterId: string) => {
    const lastSchedule = companionLocal.getLastSchedule(characterId)
    const history = companionLocal.getScheduleHistory(characterId)
    
    try {
      const result = await apiFetch('/api/companion/generate-schedule', {
        method: 'POST',
        body: JSON.stringify({
          character_id: characterId,
          last_schedule: lastSchedule?.items || [],
          history_summary: history.currentSummary || '',
          interact_count: history.totalInteractCount || 0,
        }),
      })
      
      if (result.schedule && Array.isArray(result.schedule)) {
        const items = result.schedule.map((s: any) => ({
          time: s.time,
          activity: s.activity || s.text || '',
          location: s.location || '',
          thought: s.thought || '',
          text: s.activity || s.text || '',
          done: false,
        }))
        companionLocal.saveTodaySchedule(characterId, items, result.summary || '')
        return { schedule: items, summary: result.summary }
      }
      throw new Error('Invalid schedule format')
    } catch (err) {
      console.error('Failed to refresh schedule:', err)
      throw err
    }
  },
}

export default companionApi

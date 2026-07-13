// 陪伴系统 API 调用层（本地优先版）
// 后端只提供只读配置（角色列表、物品列表），所有动态状态存 localStorage

import companionLocal from './companion-local'
import type { Letter, Conversation, Attachment } from './companion-local'

const API_BASE = '' // 使用相对路径，走 Vercel rewrite 代理，避免 CORS 问题

export function resolveAssetUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('data:')) return url
  if (url.startsWith('blob:')) return url
  if (url.startsWith('/api/')) return `${window.location.origin}${url}`
  if (url.startsWith('/')) return url
  return `/${url}`
}

function imageToBase64(imgSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建 canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        resolve(dataUrl)
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('图片加载失败，无法转 base64'))
    img.src = imgSrc
  })
}

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

function getSteamId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('steam_id')
}

function getSteamName(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('steam_name')
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken()
  const deviceId = getDeviceId()
  const steamId = getSteamId()
  const steamName = getSteamName()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-ID': deviceId,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (steamId) headers['X-Steam-ID'] = steamId
  if (steamName) headers['X-Steam-Name'] = steamName

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: 'no-store' })
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

  getUserItems: () => Promise.resolve({ items: companionLocal.getPlayerFurniture() }),

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
              attachmentUrl: resolveAssetUrl(letter.attachment_url || letter.attachmentUrl),
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

  // ========== 附件/相册（后端为唯一真实来源，本地仅兜底缓存） ==========

  getAttachments: async (characterId?: string): Promise<{ attachments: Attachment[] }> => {
    try {
      const query = characterId ? `?character_id=${characterId}` : ''
      const result = await apiFetch(`/api/companion/attachments${query}`)
      const attachments: Attachment[] = (result.attachments || []).map((att: any) => ({
        id: att.id,
        letterId: att.letter_id,
        characterId: att.character_id || characterId || 'maodie',
        src: resolveAssetUrl(att.src || att.url || att.image_url) || '',
        title: att.title,
        createdAt: att.created_at,
      }))
      // 同步到本地缓存
      companionLocal.replaceAttachments(characterId, attachments)
      return { attachments }
    } catch {
      return { attachments: companionLocal.getAttachments(characterId) }
    }
  },

  deleteAttachment: async (id: string): Promise<{ status: string }> => {
    try {
      const result = await apiFetch('/api/companion/attachments', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      })
      companionLocal.deleteAttachment(id)
      return result
    } catch {
      companionLocal.deleteAttachment(id)
      return { status: 'ok' }
    }
  },

  createAttachment: async (data: {
    character_id: string
    src: string
    title?: string
    letter_id?: string
  }): Promise<{ status: string; attachment?: Attachment }> => {
    const result = await apiFetch('/api/companion/attachments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (result.attachment) {
      companionLocal.addAttachment({
        letterId: data.letter_id,
        characterId: data.character_id,
        src: data.src,
        title: data.title || '',
        createdAt: new Date().toISOString(),
      })
    }
    return result
  },

  uploadAttachment: async (data: {
    character_id: string
    imageSrc: string
    title?: string
    letter_id?: string
  }): Promise<{ status: string; attachment?: Attachment }> => {
    let base64 = ''
    try {
      base64 = await imageToBase64(data.imageSrc)
    } catch (e) {
      console.warn('[uploadAttachment] 图片转 base64 失败，回退到直接存 src:', e)
      return { status: 'fallback', attachment: undefined }
    }

    const result = await apiFetch('/api/companion/attachments/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: base64,
        character_id: data.character_id,
        title: data.title,
        letter_id: data.letter_id,
      }),
    })

    if (result.attachment) {
      const resolvedSrc = resolveAssetUrl(result.attachment.src) || result.attachment.src
      companionLocal.addAttachment({
        id: result.attachment.id,
        letterId: data.letter_id,
        characterId: data.character_id,
        src: resolvedSrc,
        title: data.title || '',
        createdAt: new Date().toISOString(),
      })
    }
    return result
  },

  // ========== 用户资料与代币（唯一真实来源：后端数据库） ==========

  getProfile: async (): Promise<{ user?: { id: number; steam_id: string; steam_name: string; coins: number; tier: string } }> => {
    const result = await apiFetch('/api/auth/profile')
    return result
  },

  buyItem: async (itemId: string, price: number): Promise<{ status: string; coins?: number }> => {
    const result = await apiFetch(`/api/companion/user/items/${itemId}/buy`, {
      method: 'POST',
      body: JSON.stringify({ price }),
    })
    return result
  },

  previewItem: async (itemId: string): Promise<{ item?: { id: string; name: string; desc: string; category: string; price: number; emojiColor: string; image?: string } }> => {
    return apiFetch(`/api/companion/items/${itemId}/preview`)
  },

  buyItems: async (items: { item_id: string; quantity: number; price: number }[]): Promise<{ status: string; coins?: number; total_spent?: number; items_added?: any[]; message?: string }> => {
    try {
      const result = await apiFetch('/api/companion/user/items/batch-buy', {
        method: 'POST',
        body: JSON.stringify({ items }),
      })
      return result
    } catch (err: any) {
      console.error('[buyItems] 批量购买失败:', err)
      return {
        status: 'error',
        message: err?.message || '购买失败，请稍后重试',
        total_spent: 0,
        items_added: [],
      }
    }
  },

  // ========== 家具布置（后端持久化 + 本地兜底） ==========

  getFurniture: async (): Promise<{ furniture: any[] }> => {
    try {
      const result = await apiFetch('/api/companion/user/furniture')
      return { furniture: result.furniture || [] }
    } catch (err) {
      console.warn('[getFurniture] 从后端获取失败，使用本地数据:', err)
      return { furniture: companionLocal.getPlayerFurniture() }
    }
  },

  saveFurniture: async (furniture: any[]): Promise<{ ok: boolean; count?: number }> => {
    try {
      const result = await apiFetch('/api/companion/user/furniture', {
        method: 'PUT',
        body: JSON.stringify({ furniture }),
      })
      return { ok: !!result.ok, count: result.count }
    } catch (err) {
      console.warn('[saveFurniture] 保存到后端失败，仅保存本地:', err)
      companionLocal.saveFurniture(furniture)
      return { ok: true, count: furniture.length }
    }
  },

  // ========== 用户代币（后端为唯一真实来源） ==========

  getCoins: async (): Promise<{ coins: number }> => {
    try {
      const result = await apiFetch('/api/auth/profile')
      const coins = result?.user?.coins
      if (typeof coins === 'number') {
        companionLocal.setCoins(coins)
        return { coins }
      }
      return { coins: companionLocal.getCoins() }
    } catch (err) {
      console.warn('[getCoins] 从后端获取代币失败，使用本地:', err)
      return { coins: companionLocal.getCoins() }
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
      console.log('[Schedule API] 请求:', `/api/companion/schedules${query}`)
      const result = await apiFetch(`/api/companion/schedules${query}`)
      console.log('[Schedule API] 原始响应:', result)
      let list: any[] = []
      if (Array.isArray(result.schedules)) {
        list = result.schedules
      } else if (result.schedules && typeof result.schedules === 'object') {
        if (characterId && result.schedules[characterId]) {
          list = result.schedules[characterId]
        } else {
          const keys = Object.keys(result.schedules)
          if (keys.length > 0) list = result.schedules[keys[0]]
        }
      }
      console.log('[Schedule API] 解析后日程数:', list.length)
      return { schedules: list }
    } catch (err) {
      console.error('[Schedule API] 请求失败，使用本地数据:', err)
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

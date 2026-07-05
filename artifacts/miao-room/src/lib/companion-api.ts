// 陪伴系统 API 调用层
// 对接后端 https://random-ai-mail-ghost.vercel.app

const API_BASE = 'https://random-ai-mail-ghost.vercel.app'

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
  // 获取角色列表
  getCharacters: () => apiFetch('/api/companion/characters'),

  // 获取角色状态（含日程）
  getCharacterStatus: (id: string) =>
    apiFetch(`/api/companion/user/characters/${id}/status`),

  // 记录互动
  interact: (id: string, type: 'click' | 'drag' | 'double_click' = 'click') =>
    apiFetch(`/api/companion/user/characters/${id}/interact`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  // 更新位置
  updatePosition: (id: string, x: number, y: number) =>
    apiFetch(`/api/companion/user/characters/${id}/position`, {
      method: 'POST',
      body: JSON.stringify({ x, y }),
    }),

  // 获取物品列表
  getItems: () => apiFetch('/api/companion/items'),

  // 获取用户物品
  getUserItems: () => apiFetch('/api/companion/user/items'),
}

export default companionApi

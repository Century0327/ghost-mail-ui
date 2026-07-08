import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://random-ai-mail-ghost.vercel.app'

export function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user')
  const [token, setToken] = useState('')
  const [steamId, setSteamId] = useState('')
  const [steamName, setSteamName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdminLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await resp.json()
      if (resp.ok && data.status === 'ok') {
        localStorage.setItem('admin_token', token)
        window.location.href = `${API_BASE}/`
      } else {
        setError(data.error || '登录失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleUserLogin = async () => {
    setError('')
    if (!steamId) {
      setError('请输入 Steam ID')
      return
    }
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Steam-ID': steamId,
          'X-Steam-Name': steamName,
        },
        body: JSON.stringify({ steam_id: steamId, steam_name: steamName }),
      })
      const data = await resp.json()
      if (resp.ok && data.status === 'ok') {
        localStorage.setItem('steam_id', steamId)
        localStorage.setItem('steam_name', steamName || data.user?.steam_name || '')
        window.location.href = '/room'
      } else {
        setError(data.error || '登录失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleTestLogin = () => {
    setSteamId('test0000000000001')
    setSteamName('测试玩家')
    setTimeout(() => handleUserLogin(), 100)
  }

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
    if (!steamId || steamId.length !== 17) {
      setError('Steam ID 应为 17 位数字')
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

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      minHeight: '100vh',
      color: '#fff',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📬</div>
          <h1 style={{
            fontSize: 42, fontWeight: 700, marginBottom: 12,
            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Ghost Mail</h1>
          <p style={{ fontSize: 18, color: '#b0b0b0', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            来自异世界的神秘来信，与 AI 角色建立深厚羁绊
          </p>
        </header>

        {/* Features */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30, marginBottom: 60,
        }}>
          {[
            { icon: '💌', title: '不定时来信', desc: 'AI 角色会在节日或随机时刻给你寄信，带来惊喜和温暖' },
            { icon: '❤️', title: '好感度系统', desc: '通过互动提升好感度，解锁专属故事和特殊信件' },
            { icon: '📅', title: '角色日程', desc: '角色每天会自动规划自己的小日程，记录生活点滴' },
            { icon: '🎁', title: '信件收藏', desc: '收藏珍贵的信件和附件，留住每一个美好瞬间' },
            { icon: '🏆', title: '成就系统', desc: '完成各种成就，解锁特殊奖励' },
            { icon: '🐱', title: '桌宠陪伴', desc: '可爱的角色桌宠陪伴你的每一天' },
          ].map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, padding: 30, textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-5px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setShowLogin(true); setLoginMode('user') }}
              style={{
                padding: '16px 40px', fontSize: 18, fontWeight: 600, borderRadius: 12,
                border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                color: '#1a1a2e', transition: 'all 0.3s ease',
              }}
            >
              🚀 立即游玩
            </button>
            <button
              onClick={() => { setShowLogin(true); setLoginMode('admin') }}
              style={{
                padding: '16px 40px', fontSize: 18, fontWeight: 600, borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                transition: 'all 0.3s ease',
              }}
            >
              🔧 管理后台
            </button>
          </div>
        </div>

        {/* Download */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 40, marginBottom: 60,
        }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, marginBottom: 30 }}>📦 下载客户端</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: '🪟', title: 'Windows', desc: 'Windows 10 / 11' },
              { icon: '🍎', title: 'macOS', desc: 'macOS 10.15+' },
              { icon: '🐧', title: 'Linux', desc: 'Ubuntu / Fedora' },
            ].map((d, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: 24, textAlign: 'center',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{d.icon}</div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{d.title}</h3>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{d.desc}</p>
                <a href="https://github.com/Century0327/random-ai-mail-ghost/releases/latest" target="_blank" rel="noopener"
                  style={{
                    display: 'inline-block', padding: '10px 24px',
                    background: 'rgba(255,255,255,0.1)', borderRadius: 8,
                    fontSize: 14, color: '#fff', textDecoration: 'none',
                  }}>
                  下载
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Characters */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 28, marginBottom: 30 }}>👥 角色伙伴</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { icon: '🐱', name: 'Kitty' },
              { icon: '🐶', name: 'Puppy' },
              { icon: '🦊', name: 'Foxy' },
              { icon: '🐦', name: 'Birb' },
            ].map((c, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20,
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{c.icon}</div>
                <h3 style={{ fontSize: 16 }}>{c.name}</h3>
              </div>
            ))}
          </div>
        </div>

        <footer style={{ textAlign: 'center', padding: 30, color: '#666', fontSize: 14 }}>
          <p>Ghost Mail · 2026 · Made with 💖</p>
        </footer>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          padding: 20,
        }} onClick={() => setShowLogin(false)}>
          <div style={{
            width: '100%', maxWidth: 400,
            background: '#1a1a2e', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.15)',
            padding: 32,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <button
                onClick={() => setLoginMode('user')}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: 'none',
                  background: loginMode === 'user' ? 'linear-gradient(135deg, #ff9a9e, #fecfef)' : 'rgba(255,255,255,0.08)',
                  color: loginMode === 'user' ? '#1a1a2e' : '#aaa',
                }}
              >
                用户登录
              </button>
              <button
                onClick={() => setLoginMode('admin')}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: 'none',
                  background: loginMode === 'admin' ? 'linear-gradient(135deg, #ff9a9e, #fecfef)' : 'rgba(255,255,255,0.08)',
                  color: loginMode === 'admin' ? '#1a1a2e' : '#aaa',
                }}
              >
                管理员登录
              </button>
            </div>

            {loginMode === 'user' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 6 }}>Steam ID</label>
                  <input
                    type="text"
                    value={steamId}
                    onChange={e => setSteamId(e.target.value)}
                    placeholder="17 位数字"
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)', color: '#fff',
                      fontSize: 15, outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 6 }}>昵称（可选）</label>
                  <input
                    type="text"
                    value={steamName}
                    onChange={e => setSteamName(e.target.value)}
                    placeholder="你的名字"
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)', color: '#fff',
                      fontSize: 15, outline: 'none',
                    }}
                  />
                </div>
                <button
                  onClick={handleUserLogin}
                  disabled={loading}
                  style={{
                    padding: '14px 0', borderRadius: 12,
                    border: 'none', cursor: loading ? 'wait' : 'pointer',
                    background: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
                    color: '#1a1a2e', fontSize: 16, fontWeight: 600,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? '登录中...' : '进入房间'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 6 }}>管理员密钥</label>
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ADMIN_SECRET"
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)', color: '#fff',
                      fontSize: 15, outline: 'none',
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdminLogin() }}
                  />
                </div>
                <button
                  onClick={handleAdminLogin}
                  disabled={loading}
                  style={{
                    padding: '14px 0', borderRadius: 12,
                    border: 'none', cursor: loading ? 'wait' : 'pointer',
                    background: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
                    color: '#1a1a2e', fontSize: 16, fontWeight: 600,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? '验证中...' : '进入控制台'}
                </button>
              </div>
            )}

            {error && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#ff6b6b', textAlign: 'center' }}>{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

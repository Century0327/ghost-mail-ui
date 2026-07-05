import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistPixelSquare } from 'geist/font/pixel'
import { ZCOOL_KuaiLe, Noto_Sans_SC } from 'next/font/google'
import './globals.css'

const cuteFont = ZCOOL_KuaiLe({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-cute',
  display: 'swap',
})

const bodyFont = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '喵屋 · 我的治愈小房间',
  description: '一只像素风的小猫，住在温暖的房间里陪着你。点击房间里的物品，查看记忆、日程与小店。',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#efe2d2',
  userScalable: false,
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${bodyFont.variable} ${cuteFont.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AIGCBox - AI创意工具箱',
  description: 'AIGCBox 是一款专业的AI图像生成平台，提供100+创意工具模板，支持文本生图、图像编辑、风格转换等多种功能',
  keywords: ['AI', 'AIGC', '图像生成', 'AI画图', 'AI创作', 'AIGCBox'],
  openGraph: {
    title: 'AIGCBox - AI创意工具箱',
    description: '专业的AI图像生成平台',
    url: 'https://aigc.jubao.ai',
    siteName: 'AIGCBox',
    locale: 'zh-CN',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={inter.className}>
        <div className="gradient-bg" />
        {children}
      </body>
    </html>
  )
}
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "邮储文询客智中枢",
  description: "基于 Next.js 全栈单体架构的线索管理示例项目"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#fbfefd] bg-hero-glow text-slate-800">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "赛优制度",
  description: "赛优集团统一制度资料库",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

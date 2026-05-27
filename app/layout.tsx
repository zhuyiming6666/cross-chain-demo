import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
import "primeicons/primeicons.css";
import "primereact/resources/themes/lara-light-blue/theme.css";

export const metadata: Metadata = {
  title: "跨链医疗数据安全共享与隐私计算",
  description: "跨链医疗数据安全共享与隐私身份系统 Demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

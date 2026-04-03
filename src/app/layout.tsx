import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "브릿지잡스 | 징검다리 일자리 큐레이션",
  description: "실업급여 수급 요건(고용보험 가입, 1~3개월 단기)을 충족하는 안전한 알바/계약직 큐레이션 서비스",
  openGraph: {
    title: "브릿지잡스 | 징검다리 일자리 큐레이션",
    description: "위험한 프리랜서 공고를 피하고 안전한 단기 계약직에 지원해 보세요.",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

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
  description: "3.3% 공제 없는 안전한 단기 계약직 · 알바만 선별합니다. 알바몬 · 알바천국 · 잡코리아 통합 수집.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "브릿지잡스 | 단기 계약직 · 알바 큐레이션",
    description: "3.3% 공제 없는 안전한 단기 일자리만 선별합니다. 알바몬 · 알바천국 · 잡코리아 통합 수집.",
    url: "https://bridge-jobs.vercel.app",
    siteName: "브릿지잡스",
    images: [
      {
        url: "https://bridge-jobs.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "브릿지잡스 - 징검다리 일자리 큐레이션",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "브릿지잡스 | 단기 계약직 · 알바 큐레이션",
    description: "3.3% 공제 없는 안전한 단기 일자리만 선별합니다.",
    images: ["https://bridge-jobs.vercel.app/og-image.png"],
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

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
  title: 'Perso FAQ Chatbot',
  description:
    'Perso.ai / 이스트소프트 관련 Q&A만 답변하는 지식기반 챗봇입니다.',
  openGraph: {
    title: 'Perso FAQ Chatbot',
    description:
      'Perso.ai / 이스트소프트 관련 Q&A만 답변하는 지식기반 챗봇입니다.',
    url: 'https://qa-bot-rose.vercel.app',
    siteName: 'Perso FAQ Chatbot',
    images: [
      {
        url: '/thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'Perso FAQ Chatbot',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Perso FAQ Chatbot',
    description:
      'Perso.ai / 이스트소프트 관련 Q&A만 답변하는 지식기반 챗봇입니다.',
    images: ['/thumbnail.png'],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

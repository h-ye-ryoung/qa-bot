// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

type ChatMessage = {
  id: number;
  role: 'user' | 'bot';
  text: string;
  meta?: {
    matched?: boolean;
    score?: number | null;
  };
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idSeq, setIdSeq] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const initialBotMessages: Omit<ChatMessage, 'id'>[] = [
    { role: 'bot', text: '안녕하세요, Perso.ai / 이스트소프트 입니다.' },
    { role: 'bot', text: 'Perso.ai / 이스트소프트에 대해 궁금한 점을 물어보세요.' },
  ];

  const presetQuestions = [
    { label: '#서비스 소개', text: 'Perso.ai는 어떤 서비스인가요?' },
    { label: '#주요 기능', text: 'Perso.ai의 주요 기능은 무엇인가요?' },
    { label: '#요금제', text: 'Perso.ai의 요금제는 어떻게 구성되어 있나요?' },
    { label: '#사용자 수', text: 'Perso.ai의 사용자는 어느 정도인가요?' },
    { label: '#고객층', text: 'Perso.ai를 사용하는 주요 고객층은 누구인가요?' },
  ];

  // 인트로 메시지 2개 순차 출력
  useEffect(() => {
    if (messages.length > 0) return;

    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: idSeq, role: 'bot', text: initialBotMessages[0].text },
        ]);
        setIdSeq((s) => s + 1);

        timers.push(
          window.setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { id: idSeq + 1, role: 'bot', text: initialBotMessages[1].text },
            ]);
            setIdSeq((s) => s + 1);
          }, 1000),
        );
      }, 500),
    );

    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // 메시지 변경 시 채팅 박스 맨 아래로 자동 스크롤
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendQuestion = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    setError(null);
    setInput('');

    const userMsg: ChatMessage = {
      id: idSeq,
      role: 'user',
      text: q,
    };
    setIdSeq((prev) => prev + 1);
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (data.matched) {
        const botMsg: ChatMessage = {
          id: idSeq + 1,
          role: 'bot',
          text: data.answer,
          meta: {
            matched: true,
            score: data.score ?? null,
          },
        };
        setIdSeq((prev) => prev + 2);
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const botMsg: ChatMessage = {
          id: idSeq + 1,
          role: 'bot',
          text: data.reason || '등록된 Q&A에서 관련 답변을 찾지 못했습니다.',
          meta: {
            matched: false,
            score: null,
          },
        };
        setIdSeq((prev) => prev + 2);
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      console.error(err);
      setError('답변을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendQuestion(input);
  };

  return (
  <main className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
    {/* 상단 헤더 */}
    <div className="w-full bg-slate-900/50 backdrop-blur-sm shadow-md border-b border-slate-700">
      <div className="w-full px-4 sm:px-8 lg:px-10 py-4 flex justify-start">
        <img
          src="/logo.png"
          alt="Perso.ai logo"
          className="h-8 sm:h-10 w-auto"
        />
      </div>
    </div>

    {/* 본문 영역 */}
    <div className="flex-1 flex justify-center items-center">
      <div className="w-full max-w-4xl flex flex-col gap-4 px-3 sm:px-5 md:px-6 py-6 sm:py-8 md:py-10">
        <header className="flex flex-col gap-1">
          <h1 className="font-semibold text-lg sm:text-xl md:text-2xl">
            Perso FAQ Chatbot
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Perso.ai / 이스트소프트 관련 Q&A만 답변하는 지식기반 챗봇입니다.
          </p>
        </header>

        <section
          ref={containerRef}
          className="h-[480px] sm:h-[480px] md:h-[480px] rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto chat-scroll"
        >
          {messages.length === 0 && (
            <div className="text-sm text-slate-400">
              Perso.ai / 이스트소프트에 대해 궁금한 점을 물어보세요.
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'bot' ? (
                <div className="flex items-start gap-3">
                  <img
                    src="/robot.png"
                    alt="bot"
                    className="w-8 h-8 rounded-full object-cover mt-1"
                  />
                  <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-800 text-slate-50">
                    <p className="whitespace-pre-wrap break-words">
                      {m.text}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="max-w-[80%] rounded-2xl px-3 py-2 text-sm text-white
                              bg-gradient-to-r from-[#A757FD] to-[#5E57FD]"
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="text-xs text-slate-400">
              답변을 생성하는 중입니다...
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-slate-300">
          {presetQuestions.map((q) => (
            <button
              key={q.label}
              type="button"
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 hover:border-indigo-400 hover:text-indigo-300 transition disabled:opacity-40"
              onClick={() => {
                if (loading) return;
                sendQuestion(q.text);
              }}
              disabled={loading}
            >
              {q.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="질문을 입력하세요. (예: Perso.ai의 요금제는 어떻게 구성되어 있나요?)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '전송 중...' : '전송'}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  </main>
  );
}
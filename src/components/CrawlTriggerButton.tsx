"use client";

import { useState } from "react";
import { RefreshCw, Play } from "lucide-react";

export function CrawlTriggerButton() {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  const handleTrigger = async () => {
    if (!keyword.trim()) {
      alert("크롤링할 타겟 키워드를 기입해주세요. (예: 계약직 1개월)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/trigger-crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });
      
      const data = await res.json();
      if (data.success) {
        alert("✅ 크롤링 명령 전송 성공!\n약 10~20초 뒤 새로고침을 하시면 새로운 데이터가 나타납니다.");
        setKeyword("");
      } else {
        alert("❌ 트리거 실패: " + data.error);
      }
    } catch (e: any) {
      alert("네트워크 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input 
        type="text" 
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleTrigger()}
        placeholder="수집할 단어 (예: 병원 단기)" 
        className="w-32 sm:w-48 text-sm px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button 
        onClick={handleTrigger}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 font-medium text-sm rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
        강제 수집
      </button>
    </div>
  );
}

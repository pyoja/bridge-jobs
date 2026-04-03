import Link from "next/link";
import {
  Briefcase, ShieldCheck, XCircle, CheckCircle2,
  AlertTriangle, Clock, MapPin, Filter, ArrowLeft
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-20">
      {/* 헤더 */}
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">브릿지잡스</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            공고 보러가기
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 sm:p-12 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm font-medium mb-5">
              자진퇴사자 전용 실업급여 루트
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 leading-tight">
              알바몬에서 직접 찾는 것보다<br />
              <span className="text-yellow-300">더 안전하고 정확한</span> 공고만 보여드립니다
            </h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-xl">
              같은 조건으로 검색해도 고용보험이 안 되거나 3.3% 프리랜서 공고가 섞여 나옵니다.
              브릿지잡스는 <strong className="text-white">실업급여를 실제로 받을 수 있는 공고만</strong> 사전 필터링합니다.
            </p>
          </div>
        </div>

        {/* 비교 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <h2 className="font-bold text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-red-400" />알바몬 직접 검색
            </h2>
            <ul className="space-y-3">
              {[
                "3.3% 프리랜서 공고가 섞여 나옴",
                "고용보험 가입 여부 표시 없음",
                "주 15시간 미만 공고 혼재",
                "공고마다 직접 본문 확인 필요",
                "배달·뷰티·건강식품 공고 노출",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
            <h2 className="font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />브릿지잡스
            </h2>
            <ul className="space-y-3">
              {[
                "3.3% 프리랜서 공고 완전 차단",
                "고용보험 가입 가능 공고만 노출",
                "주당 근무시간 자동 계산 표시",
                "계약직·기간제 공고만 선별",
                "지역·키워드 포함/제외 정밀 필터",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 실업급여 루트 */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-amber-800 dark:text-amber-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            자진퇴사 후 실업급여 수급 루트
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
            {[
              { step: "1", label: "자진퇴사" },
              "→",
              { step: "2", label: "단기 계약직 취업\n(1~3개월)" },
              "→",
              { step: "3", label: "계약만료 퇴사" },
              "→",
              { step: "4", label: "실업급여 신청" },
            ].map((item, i) =>
              typeof item === "string" ? (
                <span key={i} className="text-zinc-400 font-bold text-lg">→</span>
              ) : (
                <div key={i} className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{item.step}</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 whitespace-pre-line text-center text-xs leading-tight">{item.label}</span>
                </div>
              )
            )}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            💡 핵심: 2단계에서 반드시 <strong>고용보험 가입 + 계약직(기간제)</strong>으로 일해야 합니다.
            계약이 만료되면 비자발적 퇴사로 인정되어 실업급여 수급이 가능해집니다.
          </p>
        </div>

        {/* 수집 조건 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-500" />
            현재 수집 조건 (알바몬 기준)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: MapPin, label: "수집 지역", value: "서울 전체" },
              { icon: Briefcase, label: "고용 형태", value: "계약직" },
              { icon: Clock, label: "근무 기간", value: "1주~3개월" },
              { icon: ShieldCheck, label: "추가 필터", value: "3.3% 제거" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-3 text-center">
                <Icon className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
                <div className="text-xs text-zinc-500 mb-0.5">{label}</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            공고 보러가기
          </Link>
        </div>
      </main>
    </div>
  );
}

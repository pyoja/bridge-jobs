"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock, CalendarDays, Building2, Heart, EyeOff } from 'lucide-react';
import { Selectable } from 'kysely';
import { JobsTable } from '@/types/database';
import { useJobPreferences } from '@/hooks/useJobPreferences';

export type JobType = Selectable<JobsTable>;

// matched_keywords 배열 파싱 및 배지 렌더링 헬퍼
type KeywordGrade = 'S' | 'A' | 'B' | 'BL';

interface ParsedKeyword {
  grade: KeywordGrade;
  keyword: string;
}

function parseMatchedKeywords(matched: string[]): ParsedKeyword[] {
  return matched
    .map((item) => {
      const sep = item.indexOf('|');
      if (sep === -1) return null;
      const grade = item.slice(0, sep) as KeywordGrade;
      const keyword = item.slice(sep + 1);
      return { grade, keyword };
    })
    .filter(Boolean) as ParsedKeyword[];
}

const GRADE_STYLE: Record<KeywordGrade, { bg: string; text: string; label: string }> = {
  S: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', label: 'S급' },
  A: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', label: 'A급' },
  B: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', label: 'B급' },
  BL: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: '⚠️' },
};

export function JobCard({ job, showHidden = false }: { job: JobType, showHidden?: boolean }) {
  const { toggleFavorite, hideJob, isFavorite, isHidden, loaded } = useJobPreferences();

  const formatWage = (amount: number | null) => {
    if (!amount) return '회사내규에 따름';
    return amount.toLocaleString() + '원';
  };

  // 숨겨진 공고 또는 즐겨찾기한 공고는 메인 목록에서 제외 (보관함에서만 볼 수 있음)
  if (!showHidden && loaded && (isHidden(job.original_url) || isFavorite(job.original_url))) return null;

  const fav = loaded && isFavorite(job.original_url);

  const parsedKeywords = parseMatchedKeywords(job.matched_keywords ?? []);
  const hasBlacklist = parsedKeywords.some((k) => k.grade === 'BL');
  const hasPositiveScore = (job.score ?? 0) > 0;

  return (
    <Card className={`hover:shadow-md transition-shadow group flex flex-col h-full relative ${
      hasBlacklist 
        ? 'opacity-70 border-red-200 dark:border-red-900/30 bg-white dark:bg-zinc-950' 
        : hasPositiveScore
          ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm shadow-emerald-100/50 dark:shadow-emerald-900/20'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
    }`}>
      {/* 즐겨찾기 + 숨기기 버튼 */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          onClick={() => toggleFavorite(job.original_url)}
          title={fav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          className={`p-1.5 rounded-full transition-all ${
            fav
              ? "bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400"
              : hasPositiveScore
                ? "bg-white/80 text-zinc-400 hover:bg-red-100 hover:text-red-400 dark:bg-black/50 dark:hover:bg-red-900/40 border border-emerald-100 dark:border-emerald-900/30"
                : "bg-zinc-100 text-zinc-400 hover:bg-red-100 hover:text-red-400 dark:bg-zinc-800 dark:hover:bg-red-900/40"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${fav ? "fill-current" : ""}`} />
        </button>
        <button
          onClick={() => hideJob(job.original_url)}
          title="이 공고 숨기기"
          className={`p-1.5 rounded-full transition-all ${
            hasPositiveScore
              ? "bg-white/80 text-zinc-400 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-black/50 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-900/30"
              : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>

      <CardHeader className={`pb-3 border-b pr-20 ${
        hasPositiveScore 
          ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-100/30 dark:bg-emerald-900/10' 
          : 'border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50'
      }`}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge
            variant="secondary"
            className={`text-xs font-semibold ${
              job.platform === '알바몬'
                ? 'bg-orange-100 text-orange-700'
                : job.platform === '알바천국'
                ? 'bg-green-100 text-green-700'
                : job.platform === '잡코리아'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {job.platform ?? '알바몬'}
          </Badge>
          {job.has_employment_insurance && (
            <Badge className="bg-blue-600 text-white text-xs shadow-sm">고용보험 O</Badge>
          )}
          {/* 점수 배지 */}
          {hasPositiveScore && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-200 dark:shadow-none animate-in fade-in zoom-in duration-300">
              ✨ 가중치 +{job.score}점
            </Badge>
          )}
          {(job.score ?? 0) < 0 && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-sm">
              🚨 위험 {job.score}점
            </Badge>
          )}
        </div>
        <CardTitle className="text-base sm:text-lg font-bold leading-snug group-hover:text-blue-600 transition-colors">
          {job.title}
        </CardTitle>
        <div className="flex items-start text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium break-words">
          <Building2 className="w-3.5 h-3.5 mr-1.5 mt-0.5 opacity-70 shrink-0" />
          <span className="leading-snug">{job.company_name}</span>
        </div>

        {/* 매칭 키워드 배지 */}
        {parsedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {parsedKeywords.map((kw, idx) => {
              const style = GRADE_STYLE[kw.grade];
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-bold ${style.bg} ${style.text} border border-white/20 dark:border-black/20`}
                >
                  <span className="opacity-80 text-[10px] tracking-tight">{style.label}</span>
                  {kw.keyword}
                </span>
              );
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4 pb-2 flex flex-col gap-2 text-sm flex-grow">
        {job.location && (
          <div className="flex items-center text-zinc-600 dark:text-zinc-400">
            <svg className="w-3.5 h-3.5 mr-2 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{job.location}</span>
          </div>
        )}
        <div className="flex items-center text-zinc-600 dark:text-zinc-400">
          <CalendarDays className="w-3.5 h-3.5 mr-2 shrink-0 text-zinc-400" />
          <span>{job.work_duration}</span>
        </div>
        <div className="flex items-center text-zinc-600 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5 mr-2 shrink-0 text-zinc-400" />
          <span>{job.work_hours || '협의'}</span>
        </div>

        {/* 급여 */}
        <div className="flex items-center gap-2 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-1">
          <Badge variant="outline" className="text-xs border-zinc-300 dark:border-zinc-700 shrink-0 bg-transparent">
            {job.wage_type || '급여'}
          </Badge>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatWage(job.wage_amount)}</span>
        </div>

        {/* 태그 */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {job.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary"
                className={`font-normal text-[11px] rounded transition-colors ${
                  hasPositiveScore 
                    ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 hover:bg-emerald-200/50' 
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                }`}>
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-4 mt-auto">
        <a
          href={job.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-2 rounded-lg text-sm font-semibold py-2.5 px-4 transition-colors ${
            hasPositiveScore 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 dark:shadow-none' 
              : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white'
          }`}
        >
          공고 원문 보기
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </CardFooter>
    </Card>
  );
}

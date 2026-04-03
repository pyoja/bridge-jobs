import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock, CalendarDays, Building2 } from 'lucide-react';
import { Selectable } from 'kysely';
import { JobsTable } from '@/types/database';

export type JobType = Selectable<JobsTable>;

export function JobCard({ job }: { job: JobType }) {
  const formatWage = (amount: number | null) => {
    if (!amount) return '회사내규에 따름';
    return amount.toLocaleString() + '원';
  };

  const getPlatformColor = (platform: string) => {
    if (platform.toLowerCase().includes('mon')) return 'bg-orange-100 text-orange-700';
    if (platform.toLowerCase().includes('heaven')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <Card className="hover:shadow-md transition-shadow group border-zinc-200 dark:border-zinc-800 flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className={`text-xs font-semibold ${getPlatformColor(job.platform)}`}>
            {job.platform.toUpperCase()}
          </Badge>
          {job.has_employment_insurance && (
            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-blue-600">
              고용보험 O
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg md:text-xl font-bold leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
          {job.title}
        </CardTitle>
        <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
          <Building2 className="w-4 h-4 mr-1.5 opacity-70" />
          {job.company_name}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 pb-2 grid grid-cols-2 gap-y-3 gap-x-4 text-sm flex-grow">
        {job.location && (
          <div className="flex items-center text-zinc-700 dark:text-zinc-300 col-span-2">
            <svg className="w-4 h-4 mr-2 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span className="truncate">{job.location}</span>
          </div>
        )}
        <div className="flex items-center text-zinc-700 dark:text-zinc-300">
          <CalendarDays className="w-4 h-4 mr-2 text-zinc-400" />
          <span>{job.work_duration} {job.work_days && `· ${job.work_days}`}</span>
        </div>
        <div className="flex items-center text-zinc-700 dark:text-zinc-300">
          <Clock className="w-4 h-4 mr-2 text-zinc-400" />
          <span>{job.work_hours || '협의'}</span>
        </div>
        <div className="flex items-center text-zinc-900 dark:text-zinc-100 font-semibold col-span-2 pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-1 pb-1">
          <Badge variant="outline" className="mr-2 text-xs border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
            {job.wage_type || '급여'}
          </Badge>
          <span className="text-[15px]">{formatWage(job.wage_amount)}</span>
        </div>

        {/* 태그 리스트 */}
        {job.tags && job.tags.length > 0 && (
          <div className="col-span-2 flex flex-wrap gap-1.5 mt-2">
            {job.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 font-normal px-2 space-x-0 rounded-md">
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
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black h-11 px-4 py-2 shadow"
        >
          공고 원문 보기
          <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </CardFooter>
    </Card>
  );
}

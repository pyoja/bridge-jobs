"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { geocodeAddress } from "@/actions/geocode";
import { MapPin, Search, Loader2, X } from "lucide-react";

export function LocationSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const currentLat = searchParams?.get("lat");
  const currentAddr = searchParams?.get("addr");

  useEffect(() => {
    setMounted(true);
    
    // URL에 정보가 없는데 localStorage에 저장된 위치가 있다면, URL 정보 업데이트 (자동 정렬)
    if (!searchParams?.get("lat")) {
      const savedLat = localStorage.getItem("bridge_lat");
      const savedLng = localStorage.getItem("bridge_lng");
      const savedAddr = localStorage.getItem("bridge_addr");
      
      if (savedLat && savedLng) {
        const params = new URLSearchParams(searchParams?.toString());
        params.set("lat", savedLat);
        params.set("lng", savedLng);
        if (savedAddr) params.set("addr", savedAddr);
        router.replace(`/?${params.toString()}`);
      }
    }
  }, [searchParams, router]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await geocodeAddress(query);
      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.lat && res.lng) {
        localStorage.setItem("bridge_lat", res.lat.toString());
        localStorage.setItem("bridge_lng", res.lng.toString());
        localStorage.setItem("bridge_addr", res.roadAddress!);

        const params = new URLSearchParams(searchParams?.toString());
        params.set("lat", res.lat.toString());
        params.set("lng", res.lng.toString());
        params.set("addr", res.roadAddress!);
        params.delete("page");
        
        router.push(`/?${params.toString()}`);
        setQuery("");
      }
    } catch (err) {
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem("bridge_lat");
    localStorage.removeItem("bridge_lng");
    localStorage.removeItem("bridge_addr");
    
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("lat");
    params.delete("lng");
    params.delete("addr");
    router.push(`/?${params.toString()}`);
  };

  if (!mounted) return null;

  return (
    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm mb-6">
      {currentLat && currentAddr ? (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">내 위치 기준 가까운 순 정렬</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{currentAddr}</p>
            </div>
          </div>
          <button 
            onClick={handleClear} 
            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700"
            title="위치 초기화"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSearch} className="relative">
          <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            내 위치 검색
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="동/읍/면 또는 도로명 주소를 입력하세요"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl text-sm disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center min-w-[72px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </form>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

const FAVORITES_KEY = "bridge_jobs_favorites";
const HIDDEN_KEY = "bridge_jobs_hidden";

export function useJobPreferences() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const fav = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      const hid = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
      setFavorites(fav);
      setHidden(hid);
    } catch {
      setFavorites([]);
      setHidden([]);
    }
    setLoaded(true);
  }, []);

  const toggleFavorite = useCallback((url: string) => {
    setFavorites((prev) => {
      const next = prev.includes(url)
        ? prev.filter((u) => u !== url)
        : [...prev, url];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const hideJob = useCallback((url: string) => {
    setHidden((prev) => {
      const next = [...prev, url];
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = (url: string) => favorites.includes(url);
  const isHidden = (url: string) => hidden.includes(url);

  return { favorites, hidden, loaded, toggleFavorite, hideJob, isFavorite, isHidden };
}

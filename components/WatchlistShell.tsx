"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../lib/useAuth';
import MovieCard from './MovieCard';

interface MovieItem {
  id: number;
  title: string;
  year: number;
  posterUrl: string;
  review?: string;
  originalLanguage?: string;
}

interface WatchlistShellProps {
  view: 'watchlist' | 'watched';
}

const LANGUAGE_OPTIONS = [
  { label: 'English', code: 'en' },
  { label: 'Malayalam', code: 'ml' },
  { label: 'Hindi', code: 'hi' },
  { label: 'Tamil', code: 'ta' },
  { label: 'Telugu', code: 'te' },
  { label: 'Kannada', code: 'kn' },
];

const STORAGE_WATCHLIST_KEY = 'minimalist-tracker-watchlist';
const STORAGE_WATCHED_KEY = 'minimalist-tracker-watched';
const STORAGE_WEEKLY_PICKS_KEY = 'minimalist-tracker-weekly-picks';
const WATCHLIST_DOC_ID = 'user-watchlist';

export default function WatchlistShell({ view }: WatchlistShellProps) {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [watchList, setWatchList] = useState<MovieItem[]>([]);
  const [watchedList, setWatchedList] = useState<MovieItem[]>([]);
  const [weeklyPicks, setWeeklyPicks] = useState<MovieItem[]>([]);
  const [suggestions, setSuggestions] = useState<MovieItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newReleases, setNewReleases] = useState<MovieItem[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(LANGUAGE_OPTIONS.map((option) => option.code));
  const [hasLoadedRemote, setHasLoadedRemote] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
  const [editingReview, setEditingReview] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign in');
    }
  };

  const handleLogout = async () => {
    try {
      setAuthError(null);
      await signOut(auth);
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign out');
    }
  };

  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      try {
        if (user) {
          // Logged in: load from Firestore
          const docRef = doc(db, 'watchlists', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setWatchList(data.watchlist || []);
            setWatchedList(data.watched || []);
            setWeeklyPicks(data.weeklyPicks || []);
          } else {
            // No Firestore data: migrate from localStorage if available
            const persistedWatch = localStorage.getItem(STORAGE_WATCHLIST_KEY);
            const persistedWatched = localStorage.getItem(STORAGE_WATCHED_KEY);
            const persistedWeekly = localStorage.getItem(STORAGE_WEEKLY_PICKS_KEY);
            const migratedWatch = persistedWatch ? JSON.parse(persistedWatch) : [];
            const migratedWatched = persistedWatched ? JSON.parse(persistedWatched) : [];
            const migratedWeekly = persistedWeekly ? JSON.parse(persistedWeekly) : [];
            setWatchList(migratedWatch);
            setWatchedList(migratedWatched);
            setWeeklyPicks(migratedWeekly);
            // Save migrated data to Firestore
            await setDoc(docRef, {
              watchlist: migratedWatch,
              watched: migratedWatched,
              weeklyPicks: migratedWeekly,
            });
            // Clear localStorage after migration
            localStorage.removeItem(STORAGE_WATCHLIST_KEY);
            localStorage.removeItem(STORAGE_WATCHED_KEY);
            localStorage.removeItem(STORAGE_WEEKLY_PICKS_KEY);
          }
        } else {
          // Not logged in: load from localStorage
          const persistedWatch = localStorage.getItem(STORAGE_WATCHLIST_KEY);
          const persistedWatched = localStorage.getItem(STORAGE_WATCHED_KEY);
          const persistedWeekly = localStorage.getItem(STORAGE_WEEKLY_PICKS_KEY);
          if (persistedWatch) setWatchList(JSON.parse(persistedWatch));
          if (persistedWatched) setWatchedList(JSON.parse(persistedWatched));
          if (persistedWeekly) setWeeklyPicks(JSON.parse(persistedWeekly));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage
        const persistedWatch = localStorage.getItem(STORAGE_WATCHLIST_KEY);
        const persistedWatched = localStorage.getItem(STORAGE_WATCHED_KEY);
        const persistedWeekly = localStorage.getItem(STORAGE_WEEKLY_PICKS_KEY);
        if (persistedWatch) setWatchList(JSON.parse(persistedWatch));
        if (persistedWatched) setWatchedList(JSON.parse(persistedWatched));
        if (persistedWeekly) setWeeklyPicks(JSON.parse(persistedWeekly));
      } finally {
        setHasLoadedRemote(true);
      }
    };
    loadData();
  }, [user, authLoading]);

  // Clear state when user logs out
  useEffect(() => {
    if (!authLoading && !user) {
      setWatchList([]);
      setWatchedList([]);
      setWeeklyPicks([]);
      setHasLoadedRemote(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!hasLoadedRemote) return;
    const saveData = async () => {
      try {
        // Only save to Firestore if user is logged in
        if (user) {
          await setDoc(doc(db, 'watchlists', user.uid), {
            watchlist: watchList,
            watched: watchedList,
            weeklyPicks: weeklyPicks,
          });
        } else {
          // Save to localStorage for anonymous users
          localStorage.setItem(STORAGE_WATCHLIST_KEY, JSON.stringify(watchList));
          localStorage.setItem(STORAGE_WATCHED_KEY, JSON.stringify(watchedList));
          localStorage.setItem(STORAGE_WEEKLY_PICKS_KEY, JSON.stringify(weeklyPicks));
        }
      } catch (error) {
        console.error('Error saving data:', error);
        localStorage.setItem(STORAGE_WATCHLIST_KEY, JSON.stringify(watchList));
        localStorage.setItem(STORAGE_WATCHED_KEY, JSON.stringify(watchedList));
        localStorage.setItem(STORAGE_WEEKLY_PICKS_KEY, JSON.stringify(weeklyPicks));
      }
    };
    saveData();
  }, [watchList, watchedList, weeklyPicks, hasLoadedRemote, user]);

  useEffect(() => {
    fetch('/api/new-releases')
      .then((res) => res.json())
      .then((data) => setNewReleases(data.results || []))
      .catch(() => setNewReleases([]));
  }, []);

  const filteredNewReleases = newReleases.filter((movie) =>
    movie.originalLanguage ? selectedLanguages.includes(movie.originalLanguage) : true
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const addToWatchList = (movie: MovieItem) => {
    if (!user) {
      setAuthError('Please login to add movies to your watchlist');
      return;
    }
    if (watchList.some((item) => item.id === movie.id) || watchedList.some((item) => item.id === movie.id)) {
      return;
    }
    setWatchList((prev) => [...prev, movie]);
    setQuery('');
  };

  const markAsWatched = (movie: MovieItem) => {
    if (!user) {
      setAuthError('Please login to mark movies as watched');
      return;
    }
    setWatchList((prev) => prev.filter((item) => item.id !== movie.id));
    setWatchedList((prev) => [movie, ...prev]);
  };

  const returnToWatchList = (movie: MovieItem) => {
    if (!user) {
      setAuthError('Please login to modify your watchlist');
      return;
    }
    setWatchedList((prev) => prev.filter((item) => item.id !== movie.id));
    setWatchList((prev) => [movie, ...prev]);
  };

  const addToWeeklyPicks = (movie: MovieItem) => {
    if (!user) {
      setAuthError('Please login to add movies to weekly picks');
      return;
    }
    if (weeklyPicks.length >= 2) return; // Limit to 2 movies
    if (weeklyPicks.some((item) => item.id === movie.id)) return;
    setWeeklyPicks((prev) => [...prev, movie]);
  };

  const removeFromWeeklyPicks = (movieId: number) => {
    if (!user) {
      setAuthError('Please login to modify weekly picks');
      return;
    }
    setWeeklyPicks((prev) => prev.filter((item) => item.id !== movieId));
  };

  const markWeeklyPickAsWatched = (movie: MovieItem) => {
    markAsWatched(movie);
    removeFromWeeklyPicks(movie.id);
  };

  const startEditingReview = (movie: MovieItem) => {
    setEditingMovieId(movie.id);
    setEditingReview(movie.review || '');
  };

  const saveReview = (listType: 'watchlist' | 'watched', movieId: number) => {
    if (!user) {
      setAuthError('Please login to add reviews');
      return;
    }
    const targetList = listType === 'watchlist' ? watchList : watchedList;
    const updated = targetList.map((m) =>
      m.id === movieId ? { ...m, review: editingReview.slice(0, 140) } : m
    );
    if (listType === 'watchlist') {
      setWatchList(updated);
    } else {
      setWatchedList(updated);
    }
    setEditingMovieId(null);
  };

  const currentList = view === 'watchlist' ? watchList : watchedList;
  const currentTitle = view === 'watchlist' ? 'Watchlist' : 'Watched List';
  const currentSubtitle = view === 'watchlist'
    ? 'Films you plan to watch next.'
    : 'Films you have already marked as watched.';
  const currentEmpty = view === 'watchlist'
    ? 'No films in your watchlist yet. Start typing to add one.'
    : 'No watched films yet. Mark a film from the watchlist.';

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 text-gray-900">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">My Watchlist</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 sm:gap-2 rounded-full border border-gray-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm text-sm sm:text-base">
                <Link href="/watchlist" className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${view === 'watchlist' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Watchlist
              </Link>
              <Link href="/watched" className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${view === 'watched' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Watched
                </Link>
              </div>
              {authLoading ? (
                <div className="text-xs text-gray-500">Loading...</div>
              ) : user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-700">{user.displayName || user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="rounded-full bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition hover:bg-gray-800"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="rounded-full bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition hover:bg-gray-800"
                >
                  Login with Google
                </button>
              )}
            </div>
          </div>
          <p className="hidden sm:block text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-600">Curate, search, pin, and mark films with a whisper of color-driven elegance.</p>

          {authError && (
            <div className="rounded-2xl sm:rounded-3xl border border-red-300 bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-700">
              {authError}
            </div>
          )}

          {!user && !authLoading && (
            <div className="rounded-2xl sm:rounded-3xl border border-blue-300 bg-blue-50 p-3 sm:p-4 text-xs sm:text-sm text-blue-700">
              <p className="font-semibold mb-1">You can view films, but need to login to add/edit them.</p>
              <p>Sign in with Google to save your watchlist across devices.</p>
            </div>
          )}

          <section className="rounded-2xl sm:rounded-3xl border border-black/10 bg-white/90 p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1">
                <label htmlFor="movie-search" className="hidden sm:block text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-gray-500">Add film to watchlist</label>
                <input
                  id="movie-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Type a title..."
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-black focus:bg-white"
                />
              </div>
              <div className="hidden sm:block text-right text-xs sm:text-sm text-gray-500">
                <p>Watchlist: {watchList.length}</p>
                <p>Watched: {watchedList.length}</p>
              </div>
            </div>

            <div className="mt-3 sm:mt-4">
              {isLoading ? (
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">Loading films from TMDB…</div>
              ) : suggestions.length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestions.map((movie) => {
                    const isAlreadyAdded = watchList.some((item) => item.id === movie.id) || watchedList.some((item) => item.id === movie.id);
                    return (
                      <li key={movie.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-3 transition hover:border-black/20">
                        <div className="flex items-center gap-3">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="h-12 w-8 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{movie.title}</p>
                            <p className="text-xs text-gray-500">{movie.year}</p>
                          </div>
                          <button
                            onClick={() => addToWatchList(movie)}
                            disabled={isAlreadyAdded || !user}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isAlreadyAdded || !user
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800'
                            }`}
                            title={!user ? 'Login to add movies' : isAlreadyAdded ? 'Already added' : 'Add to watchlist'}
                          >
                            {isAlreadyAdded ? '✓' : '+'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">No matching films found yet. Try another title.</div>
              )}
            </div>
          </section>

          {view === 'watchlist' && weeklyPicks.length > 0 && (
            <section className="rounded-2xl sm:rounded-3xl border border-black/10 bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 shadow-xl">
              <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-purple-900">Try this week</h2>
                  <p className="hidden sm:block text-xs sm:text-sm text-purple-700">Your curated picks for this week's viewing.</p>
                </div>
                <div className="text-right text-xs sm:text-sm text-purple-600 flex-shrink-0">
                  <p>{weeklyPicks.length} of 2 selected</p>
                </div>
              </div>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                {weeklyPicks.map((movie) => (
                  <div key={movie.id} className="space-y-3 rounded-2xl sm:rounded-3xl bg-white p-3 sm:p-4 shadow-sm">
                    <MovieCard id={movie.id} title={movie.title} posterUrl={movie.posterUrl} review={movie.review || 'Add a review...'} year={movie.year} />
                    <div className="flex gap-2 text-xs sm:text-sm">
                      <button
                        onClick={() => removeFromWeeklyPicks(movie.id)}
                        className="flex-1 rounded-xl sm:rounded-2xl border border-red-300 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-red-600 transition hover:border-red-400"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => markWeeklyPickAsWatched(movie)}
                        className="flex-1 rounded-xl sm:rounded-2xl bg-black px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                      >
                        Watched
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl sm:rounded-3xl border border-black/10 bg-white/90 p-4 sm:p-6 shadow-xl">
            <div className="mb-3 sm:mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">{currentTitle}</h2>
                <p className="hidden sm:block text-xs sm:text-sm text-gray-500">{currentSubtitle}</p>
              </div>
            </div>
            {currentList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/90 p-8 text-center text-gray-500">{currentEmpty}</div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {currentList.map((movie) => (
                  <div key={movie.id} className="space-y-3 rounded-2xl sm:rounded-3xl bg-white p-3 sm:p-4 shadow-sm">
                    {editingMovieId === movie.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingReview}
                          onChange={(e) => setEditingReview(e.target.value)}
                          placeholder="Write a review (max 140 chars)..."
                          maxLength={140}
                          className="w-full rounded-xl sm:rounded-2xl border border-gray-200 bg-slate-50 p-2 sm:p-3 text-xs sm:text-sm outline-none focus:border-black focus:bg-white resize-none"
                          rows={3}
                        />
                        <p className="text-xs text-gray-500">{editingReview.length}/140</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveReview(view, movie.id)}
                            className="flex-1 rounded-xl sm:rounded-2xl bg-black px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-white hover:bg-gray-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMovieId(null)}
                            className="flex-1 rounded-xl sm:rounded-2xl border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold hover:border-black"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MovieCard id={movie.id} title={movie.title} posterUrl={movie.posterUrl} review={movie.review || 'Add a review...'} year={movie.year} />
                        <button
                          onClick={() => startEditingReview(movie)}
                          disabled={!user}
                          className="w-full rounded-xl sm:rounded-2xl border border-gray-300 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-gray-600 transition hover:border-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {movie.review ? 'Edit Review' : 'Add Review'}
                        </button>
                      </>
                    )}
                    {view === 'watchlist' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => addToWeeklyPicks(movie)}
                            disabled={!user || weeklyPicks.length >= 2 || weeklyPicks.some((item) => item.id === movie.id)}
                            className="rounded-xl sm:rounded-2xl border border-purple-300 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-purple-600 transition hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {weeklyPicks.some((item) => item.id === movie.id) ? 'In Weekly Picks' : 'Add to Week'}
                          </button>
                          <button
                            onClick={() => markAsWatched(movie)}
                            disabled={!user}
                            className="rounded-xl sm:rounded-2xl bg-black px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Mark Watched
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => returnToWatchList(movie)}
                        disabled={!user}
                        className="w-full rounded-xl sm:rounded-2xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 transition hover:border-black disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Return to Watchlist
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-4 sm:top-6 lg:top-8">
            <section className="rounded-2xl sm:rounded-3xl border border-black/10 bg-white/90 p-4 sm:p-6 shadow-xl">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">New Releases</h2>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Filter by language and discover new films from South Asia.</p>
              <div className="mb-3 sm:mb-4 grid grid-cols-2 gap-2">
                {LANGUAGE_OPTIONS.map((option) => (
                  <label key={option.code} className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs text-gray-700 hover:border-black cursor-pointer\">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(option.code)}
                      onChange={() => {
                        setSelectedLanguages((prev) =>
                          prev.includes(option.code)
                            ? prev.filter((code) => code !== option.code)
                            : [...prev, option.code]
                        );
                      }}
                      className="h-3 w-3 sm:h-4 sm:w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {filteredNewReleases.length === 0 ? (
                <div className="text-center text-xs sm:text-sm text-gray-500">No new releases match the selected languages.</div>
              ) : (
                <ul className="space-y-2 sm:space-y-3">
                  {filteredNewReleases.map((movie) => (
                    <li key={movie.id} className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold truncate">{movie.title}</p>
                        <p className="text-xs text-gray-500">{movie.year}</p>
                      </div>
                      <button
                        onClick={() => addToWatchList(movie)}
                        disabled={!user}
                        className="text-xs bg-black text-white px-2 py-1 rounded-full hover:bg-gray-800 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

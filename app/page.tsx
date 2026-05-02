"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import MovieCard from '../components/MovieCard';

interface MovieItem {
  id: number;
  title: string;
  year: number;
  posterUrl: string;
  review?: string;
}

const STORAGE_WATCHLIST_KEY = 'minimalist-tracker-watchlist';
const STORAGE_WATCHED_KEY = 'minimalist-tracker-watched';

const WATCHLIST_DOC_ID = 'user-watchlist';

export default function Home() {
  const [query, setQuery] = useState('');
  const [watchList, setWatchList] = useState<MovieItem[]>([]);
  const [watchedList, setWatchedList] = useState<MovieItem[]>([]);
  const [suggestions, setSuggestions] = useState<MovieItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newReleases, setNewReleases] = useState<MovieItem[]>([]);
  const [hasLoadedRemote, setHasLoadedRemote] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
  const [editingReview, setEditingReview] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'watchlists', WATCHLIST_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWatchList(data.watchlist || []);
          setWatchedList(data.watched || []);
        } else {
          const persistedWatch = localStorage.getItem(STORAGE_WATCHLIST_KEY);
          const persistedWatched = localStorage.getItem(STORAGE_WATCHED_KEY);
          if (persistedWatch) setWatchList(JSON.parse(persistedWatch));
          if (persistedWatched) setWatchedList(JSON.parse(persistedWatched));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        const persistedWatch = localStorage.getItem(STORAGE_WATCHLIST_KEY);
        const persistedWatched = localStorage.getItem(STORAGE_WATCHED_KEY);
        if (persistedWatch) setWatchList(JSON.parse(persistedWatch));
        if (persistedWatched) setWatchedList(JSON.parse(persistedWatched));
      } finally {
        setHasLoadedRemote(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!hasLoadedRemote) return;

    const saveData = async () => {
      try {
        await setDoc(doc(db, 'watchlists', WATCHLIST_DOC_ID), {
          watchlist: watchList,
          watched: watchedList,
        });
      } catch (error) {
        console.error('Error saving data:', error);
        localStorage.setItem(STORAGE_WATCHLIST_KEY, JSON.stringify(watchList));
        localStorage.setItem(STORAGE_WATCHED_KEY, JSON.stringify(watchedList));
      }
    };
    saveData();
  }, [watchList, watchedList, hasLoadedRemote]);

  useEffect(() => {
    fetch('/api/new-releases')
      .then((res) => res.json())
      .then((data) => setNewReleases(data.results || []))
      .catch(() => setNewReleases([]));
  }, []);

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
    if (watchList.some((item) => item.id === movie.id) || watchedList.some((item) => item.id === movie.id)) {
      return;
    }
    setWatchList((prev) => [...prev, movie]);
    setQuery('');
  };

  const markAsWatched = (movie: MovieItem) => {
    setWatchList((prev) => prev.filter((item) => item.id !== movie.id));
    setWatchedList((prev) => [movie, ...prev]);
  };

  const returnToWatchList = (movie: MovieItem) => {
    setWatchedList((prev) => prev.filter((item) => item.id !== movie.id));
    setWatchList((prev) => [movie, ...prev]);
  };

  const startEditingReview = (movie: MovieItem) => {
    setEditingMovieId(movie.id);
    setEditingReview(movie.review || '');
  };

  const saveReview = (list: MovieItem[], movieId: number) => {
    const updated = list.map((m) =>
      m.id === movieId ? { ...m, review: editingReview.slice(0, 140) } : m
    );
    if (list === watchList) {
      setWatchList(updated);
    } else {
      setWatchedList(updated);
    }
    setEditingMovieId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <header className="mb-8">
            <h1 className="text-4xl font-semibold text-center mb-2">My Watchlist</h1>
            <p className="text-center text-sm uppercase tracking-[0.3em] text-gray-600">Curate, search, pin, and mark films with a whisper of color-driven elegance.</p>
          </header>

          <section className="mb-10 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1">
                <label htmlFor="movie-search" className="block text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Add film to watchlist</label>
                <input
                  id="movie-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Type a title..."
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-black focus:bg-white"
                />
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Watchlist: {watchList.length}</p>
                <p>Watched: {watchedList.length}</p>
              </div>
            </div>

            <div className="mt-4">
              {isLoading ? (
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">Loading films from TMDB…</div>
              ) : suggestions.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {suggestions.map((movie) => (
                    <li key={movie.id} className="rounded-3xl border border-gray-200 bg-gray-50 p-4 transition hover:border-black/20">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">{movie.title}</p>
                          <p className="text-sm text-gray-500">{movie.year}</p>
                        </div>
                        <button
                          onClick={() => addToWatchList(movie)}
                          className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                        >
                          Add
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">No matching films found yet. Try another title.</div>
              )}
            </div>
          </section>

          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Watchlist</h2>
                <p className="text-sm text-gray-500">Films you plan to watch next.</p>
              </div>
            </div>
            {watchList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/90 p-8 text-center text-gray-500">No films in your watchlist yet. Start typing to add one.</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {watchList.map((movie) => (
                  <div key={movie.id} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
                    {editingMovieId === movie.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingReview}
                          onChange={(e) => setEditingReview(e.target.value)}
                          placeholder="Write a review (max 140 chars)..."
                          maxLength={140}
                          className="w-full rounded-2xl border border-gray-200 bg-slate-50 p-3 text-sm outline-none focus:border-black focus:bg-white resize-none"
                          rows={4}
                        />
                        <p className="text-xs text-gray-500">{editingReview.length}/140</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveReview(watchList, movie.id)}
                            className="flex-1 rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMovieId(null)}
                            className="flex-1 rounded-2xl border border-gray-300 px-3 py-2 text-xs font-semibold hover:border-black"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MovieCard title={movie.title} posterUrl={movie.posterUrl} review={movie.review || 'Add a review...'} year={movie.year} />
                        <button
                          onClick={() => startEditingReview(movie)}
                          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-black"
                        >
                          {movie.review ? 'Edit Review' : 'Add Review'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => markAsWatched(movie)}
                      className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Mark as Watched
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Watched List</h2>
                <p className="text-sm text-gray-500">Films you have already marked as watched.</p>
              </div>
            </div>
            {watchedList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/90 p-8 text-center text-gray-500">No watched films yet. Mark a film from the watchlist.</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {watchedList.map((movie) => (
                  <div key={movie.id} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
                    {editingMovieId === movie.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingReview}
                          onChange={(e) => setEditingReview(e.target.value)}
                          placeholder="Write a review (max 140 chars)..."
                          maxLength={140}
                          className="w-full rounded-2xl border border-gray-200 bg-slate-50 p-3 text-sm outline-none focus:border-black focus:bg-white resize-none"
                          rows={4}
                        />
                        <p className="text-xs text-gray-500">{editingReview.length}/140</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveReview(watchedList, movie.id)}
                            className="flex-1 rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMovieId(null)}
                            className="flex-1 rounded-2xl border border-gray-300 px-3 py-2 text-xs font-semibold hover:border-black"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MovieCard title={movie.title} posterUrl={movie.posterUrl} review={movie.review || 'Add a review...'} year={movie.year} />
                        <button
                          onClick={() => startEditingReview(movie)}
                          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-black"
                        >
                          {movie.review ? 'Edit Review' : 'Add Review'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => returnToWatchList(movie)}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-black"
                    >
                      Return to Watchlist
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-8">
            <section className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">New Releases</h2>
              <p className="text-sm text-gray-500 mb-4">Fresh films from English, Malayalam, Hindi, Tamil, Telugu, Kannada.</p>
              {newReleases.length === 0 ? (
                <div className="text-center text-sm text-gray-500">Loading new releases...</div>
              ) : (
                <ul className="space-y-4">
                  {newReleases.map((movie) => (
                    <li key={movie.id} className="flex items-center gap-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-12 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{movie.title}</p>
                        <p className="text-xs text-gray-500">{movie.year}</p>
                      </div>
                      <button
                        onClick={() => addToWatchList(movie)}
                        className="text-xs bg-black text-white px-2 py-1 rounded-full hover:bg-gray-800"
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

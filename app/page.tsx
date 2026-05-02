import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-black/10 bg-white/90 p-10 shadow-2xl">
        <header className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-gray-500">My Watchlist</p>
          <h1 className="mt-4 text-5xl font-semibold">Two-page watchlist experience</h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">Use separate pages for your active watchlist and your watched collection. This keeps the app fast as content grows.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/watchlist"
            className="rounded-[1.5rem] border border-black/10 bg-black px-6 py-6 text-center text-lg font-semibold text-white transition hover:bg-gray-900"
          >
            Open Watchlist
          </Link>
          <Link
            href="/watched"
            className="rounded-[1.5rem] border border-black/10 bg-white px-6 py-6 text-center text-lg font-semibold text-gray-900 transition hover:bg-gray-100"
          >
            Open Watched
          </Link>
        </div>
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() || '';
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing TMDB_API_KEY environment variable' }, { status: 500 });
  }

  const url = query
    ? `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`
    : `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ error: 'TMDB request failed' }, { status: response.status });
  }

  const data = await response.json();
  const results = (data.results || []).slice(0, 8).map((item: any) => ({
    id: item.id,
    title: item.title || item.name || 'Unknown title',
    year: item.release_date ? Number(item.release_date.slice(0, 4)) : item.first_air_date ? Number(item.first_air_date.slice(0, 4)) : 0,
    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/placeholder.jpg',
  }));

  return NextResponse.json({ results });
}

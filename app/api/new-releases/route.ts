import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing TMDB_API_KEY environment variable' }, { status: 500 });
  }

  // Fetch now playing movies in India (covers multiple languages)
  const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&region=IN&page=1`;

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ error: 'TMDB request failed' }, { status: response.status });
  }

  const data = await response.json();
  const results = (data.results || []).slice(0, 10).map((item: any) => ({
    id: item.id,
    title: item.title || item.name || 'Unknown title',
    year: item.release_date ? Number(item.release_date.slice(0, 4)) : item.first_air_date ? Number(item.first_air_date.slice(0, 4)) : 0,
    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/placeholder.jpg',
    originalLanguage: item.original_language,
  }));

  return NextResponse.json({ results });
}
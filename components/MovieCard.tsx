"use client";

import { useEffect, useState } from 'react';

interface MovieCardProps {
  id: number;
  title: string;
  posterUrl: string;
  review: string;
  year: number;
}

const MovieCard: React.FC<MovieCardProps> = ({ id, title, posterUrl, review, year }) => {
  const [dominantColor, setDominantColor] = useState<string>('#000000');
  const [isHovered, setIsHovered] = useState(false);
  const tmdbUrl = `https://www.themoviedb.org/movie/${id}`;

  useEffect(() => {
    const extractColor = async () => {
      try {
        // @ts-ignore - dynamic import type issue
        const ColorThief = (await import('colorthief')).default;
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = posterUrl;
        img.onload = () => {
          try {
            const colorThief = new ColorThief();
            const color = colorThief.getColor(img);
            setDominantColor(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
          } catch (e) {
            console.warn('Color extraction failed:', e);
          }
        };
      } catch (e) {
        console.warn('ColorThief import failed:', e);
      }
    };
    extractColor();
  }, [posterUrl]);

  return (
    <div
      className="relative w-64 h-96 rounded-lg overflow-hidden shadow-lg cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${dominantColor} 0%, rgba(0,0,0,0.8) 100%)`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={posterUrl}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-3 right-3 z-20">
        <a
          href={tmdbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
          title="Open on TMDB"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span className="sr-only">Open on TMDB</span>
        </a>
      </div>
      {isHovered && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center p-4 text-white">
          <h3 className="text-lg font-bold mb-2">{title} ({year})</h3>
          <p className="text-sm text-center">{review}</p>
        </div>
      )}
    </div>
  );
};

export default MovieCard;
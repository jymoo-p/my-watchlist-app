"use client";

import { useEffect, useState } from 'react';

interface MovieCardProps {
  title: string;
  posterUrl: string;
  review: string;
  year: number;
}

const MovieCard: React.FC<MovieCardProps> = ({ title, posterUrl, review, year }) => {
  const [dominantColor, setDominantColor] = useState<string>('#000000');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const extractColor = async () => {
      try {
        const module = await import('colorthief');
        const ColorThief = module.default || module;
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
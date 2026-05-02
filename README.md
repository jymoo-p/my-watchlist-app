# Film Watchlist App

A modern web application for managing your movie watchlist, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Search movies using TMDB API
- Add movies to watchlist or mark as watched
- Adaptive theming based on movie posters
- Bilingual support (English/Malayalam)
- Cross-device persistence with Firebase
- New releases sidebar
- Exportable movie cards
- AI-powered review distillation (coming soon)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.local.example)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file with:

```
TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
OPENAI_API_KEY=your_openai_key (optional)
```

## Deploy on Vercel

The easiest way to deploy is using Vercel:

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

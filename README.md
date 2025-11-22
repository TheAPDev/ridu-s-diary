# Ridu's Diary

This is a Vite + React + TypeScript writing app scaffold. It uses Tailwind CSS and Supabase for storage. Keep secrets out of the repo — set them via environment variables in your host (Netlify, Vercel, or local .env).

Quick start

1. Install dependencies:

   npm install

2. Create a `.env` file (see `.env.example`) with your Supabase credentials:

   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=

3. Run dev server:

   npm run dev

4. Build for production:

   npm run build

Netlify

Set the following env vars in Netlify site settings (Build & deploy → Environment):

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Build command: `npm run build`
Publish directory: `dist`

Files of interest

- `src/lib/supabase.ts` — reads VITE_SUPABASE_* env vars and exports the Supabase client.
- `src/components` — UI components (Editor, ChapterPanel, TimelinePanel, Modal, etc.)

Weekly Habit Builder

A wellness + habit planning app built with React, Vite, and Supabase.

Getting Started
1. Clone the repo
git clone git@github.com:your-username/weekly-habit-builder.git
cd weekly-habit-builder

2. Install dependencies
npm install

3. Set up environment variables

Copy the example environment file and fill in your Supabase credentials:

cp .env.example .env.local


Open .env.local and replace the placeholders:

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here


You can find these values in your Supabase project dashboard
 under Settings → API.

4. Run the app
npm run dev


The app will start on http://localhost:5173
.

Notes

By default, the app saves data to Supabase Cloud if configured.

If no Supabase credentials are provided, the app falls back to local storage for persistence.

For development, a storage badge in the top nav shows whether you’re connected to Cloud or Local.

Tech Stack

React 18 + Vite

Supabase (Auth + Postgres DB)

TailwindCSS 4

Storybook for UI components

Vitest for testing
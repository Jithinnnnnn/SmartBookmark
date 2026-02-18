# Smart Bookmark Manager 📚

A modern, real-time bookmark manager built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- ✅ **Google OAuth Authentication** - Secure login with Google
- 🔒 **Protected Routes** - Middleware-based auth guards
- ⚡ **Real-time Updates** - Live sync across multiple tabs using Supabase channels
- 🎯 **Optimistic UI** - Instant feedback for user actions
- 🎨 **Modern Design** - Clean, responsive interface with Tailwind CSS
- 🔐 **Row Level Security** - Users only see their own bookmarks

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Backend/Auth**: Supabase (Authentication, Database, Real-time)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Prerequisites

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))

## Setup Instructions

### 1. Clone and Install

```bash
cd smart-bookmark-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon/Public Key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database

In your Supabase project, run this SQL in the SQL Editor:

```sql
-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

### 5. Configure Google OAuth

1. In your Supabase project, go to **Authentication** → **Providers**
2. Enable **Google**
3. Follow the instructions to:
   - Create a Google Cloud project
   - Set up OAuth credentials
   - Add authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret to Supabase

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## Project Structure

```
smart-bookmark-app/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login page with Google OAuth
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard with real-time features
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (redirects to login)
│   └── globals.css               # Global styles
├── lib/
│   └── supabase.ts               # Supabase client utilities
├── middleware.ts                 # Auth middleware
└── ...config files
```

## How It Works

### Real-time Subscriptions

The app uses Supabase's real-time channels to subscribe to database changes:

```typescript
supabase
  .channel('bookmarks-changes')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'bookmarks' 
  }, (payload) => {
    // Update UI when new bookmark is added
  })
  .subscribe()
```

### Optimistic UI Updates

When adding or deleting bookmarks, the UI updates immediately before the server responds, providing instant feedback:

```typescript
const [optimisticBookmarks, addOptimisticBookmark] = useOptimistic(
  bookmarks,
  (state, newBookmark) => [newBookmark, ...state]
)
```

### Protected Routes

The middleware checks authentication status and redirects:
- Unauthenticated users trying to access `/dashboard` → `/login`
- Authenticated users on `/login` → `/dashboard`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Update the OAuth redirect URL in Google Cloud Console to include your Vercel domain

## Troubleshooting

**Issue**: "Failed to login"
- Ensure Google OAuth is properly configured in Supabase
- Check that redirect URIs match exactly

**Issue**: "Bookmarks not showing"
- Verify RLS policies are set up correctly
- Check browser console for errors
- Ensure real-time is enabled on the bookmarks table

**Issue**: "Real-time not working"
- Confirm `ALTER PUBLICATION` was run
- Check Supabase logs for connection issues

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact support.

---

Built with ❤️ using Next.js and Supabase

# Database Setup Instructions

1.  **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Get Credentials**:
    *   Go to **Project Settings -> API**.
    *   Copy the `Project URL` and `anon public key`.
3.  **Run SQL Schema**:
    *   Go to the **SQL Editor** in the side menu.
    *   Open `packages/database/schema.sql` from this codebase.
    *   Copy the content and paste it into the SQL Editor.
    *   Click **Run**.
4.  **Configure Environment Variables**:
    *   In `apps/web`, create a `.env.local` file.
    *   In `apps/mobile`, create a `.env` file.
    *   Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url (for web)
EXPO_PUBLIC_SUPABASE_URL=your_project_url (for mobile)

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key (for web)
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key (for mobile)
```

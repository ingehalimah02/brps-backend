-- Supabase PostgreSQL Database Schema for Users Table
-- Execute this script in your Supabase project's SQL Editor

-- 1. Create custom enum type for Gender if it does not exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
        CREATE TYPE gender_enum AS ENUM ('male', 'female');
    END IF;
END $$;

-- 2. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birthday_date DATE NOT NULL,
    gender gender_enum DEFAULT NULL,
    age INTEGER NOT NULL,
    job_role VARCHAR(255) DEFAULT NULL,
    department VARCHAR(255) DEFAULT NULL,
    years_experience INTEGER NOT NULL DEFAULT 0,
    work_hours_per_week INTEGER NOT NULL DEFAULT 0,
    remote_ratio DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create a trigger or function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Note on Row Level Security (RLS):
-- By default, you can enable RLS on the table to protect it:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- 
-- Since the Express backend will be interacting with Supabase using the Service Role Key 
-- (which bypasses RLS), no explicit RLS policies are strictly required for backend-to-DB calls.
-- However, if users query this table directly from frontends, they will need appropriate RLS policies.

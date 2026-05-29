const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be defined in the .env file.');
  process.exit(1);
}

// Client for standard public operations, e.g., user registration, login
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Administrative client for bypass-RLS backend operations
// Used for managing user profiles in the custom 'users' table
const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

if (!supabaseAdmin) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. Admin functions may fail if RLS is active on database tables.');
}

module.exports = {
  supabase,
  supabaseAdmin: supabaseAdmin || supabase
};

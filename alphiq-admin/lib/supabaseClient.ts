// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// const SUPABASE_ADMIN = process.env.SUPABASE_SERVICE_ROLE_KEY!

// For client-side auth & read:
//   use supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
// For server/admin operations (in getServerSideProps, edge functions):
//   use supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ADMIN)

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
// export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ADMIN)

import dotenv from "dotenv"
dotenv.config()
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ycrfqlmajyntiofjatyw.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY as string
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
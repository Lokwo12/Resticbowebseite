import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://mxffqgefsufcdgnhjjsw.supabase.co";
const key = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZmZxZ2Vmc3VmY2RnbmhqanN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjY5MzMsImV4cCI6MjA5NDI0MjkzM30.3Q9VNn-LXVz1VF9ilEVVLFb2GBWVyD8nYyU2tbO0F2M";

const supabase = createClient(url, key);

async function checkSchema() {
  const tables = ['programs', 'stories', 'news', 'gallery'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table} error:`, error.message);
    } else {
      console.log(`Table ${table} columns:`, data.length > 0 ? Object.keys(data[0]) : 'Empty, cannot infer columns from data without RPC. Fetching from PostgREST...');
      
      // We can also fetch by inserting a bogus row to get the schema error, which we already saw!
      // 'icon' missing in 'programs'
      // 'author' missing in 'stories'
      // 'date' missing in 'news' and 'gallery'
    }
  }
}

checkSchema();

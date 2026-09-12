import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://mxffqgefsufcdgnhjjsw.supabase.co";
const key = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZmZxZ2Vmc3VmY2RnbmhqanN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjY5MzMsImV4cCI6MjA5NDI0MjkzM30.3Q9VNn-LXVz1VF9ilEVVLFb2GBWVyD8nYyU2tbO0F2M";

const supabase = createClient(url, key);

async function test() {
  const existing = {
    "id": "1",
    "name": "Dr. Patricia Nalubega Updated",
    "role": "Executive Director",
    "department": "leadership",
    "bio": "Updated bio",
    "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
    "email": "director@restikirya.org",
    "linkedin": null,
    "twitter": null,
    "order": 1,
    "created_at": "2026-05-29T21:55:05.103447+00:00",
    "updated_at": new Date().toISOString()
  };

  const { data, error } = await supabase.from('team').upsert(existing).select();
  console.log(error ? "Error: " + JSON.stringify(error) : "Data: " + JSON.stringify(data));
}

test();

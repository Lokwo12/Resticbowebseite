import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://mxffqgefsufcdgnhjjsw.supabase.co";
const key = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZmZxZ2Vmc3VmY2RnbmhqanN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjY5MzMsImV4cCI6MjA5NDI0MjkzM30.3Q9VNn-LXVz1VF9ilEVVLFb2GBWVyD8nYyU2tbO0F2M";

const supabase = createClient(url, key);

async function cleanup() {
  console.log("Cleaning up fake/old data from database...");
  
  // 1. Delete all programs EXCEPT prog_1, prog_2, prog_3, prog_4
  const { data: allPrograms } = await supabase.from('programs').select('id');
  if (allPrograms) {
    const validProgIds = ['prog_1', 'prog_2', 'prog_3', 'prog_4'];
    const invalidProgIds = allPrograms.map(p => p.id).filter(id => !validProgIds.includes(id));
    if (invalidProgIds.length > 0) {
      const { error } = await supabase.from('programs').delete().in('id', invalidProgIds);
      if (error) console.error("Error deleting old programs:", error);
      else console.log("Deleted old programs:", invalidProgIds);
    }
  }

  // 2. Delete all stories EXCEPT story_1
  const { data: allStories } = await supabase.from('stories').select('id');
  if (allStories) {
    const validStoryIds = ['story_1'];
    const invalidStoryIds = allStories.map(s => s.id).filter(id => !validStoryIds.includes(id));
    if (invalidStoryIds.length > 0) {
      const { error } = await supabase.from('stories').delete().in('id', invalidStoryIds);
      if (error) console.error("Error deleting old stories:", error);
      else console.log("Deleted old stories:", invalidStoryIds);
    }
  }

  // 3. Delete all news EXCEPT news_1
  const { data: allNews } = await supabase.from('news').select('id');
  if (allNews) {
    const validNewsIds = ['news_1'];
    const invalidNewsIds = allNews.map(n => n.id).filter(id => !validNewsIds.includes(id));
    if (invalidNewsIds.length > 0) {
      const { error } = await supabase.from('news').delete().in('id', invalidNewsIds);
      if (error) console.error("Error deleting old news:", error);
      else console.log("Deleted old news:", invalidNewsIds);
    }
  }

  console.log("Cleanup complete.");
}

cleanup();

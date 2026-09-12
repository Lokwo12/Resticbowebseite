import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://mxffqgefsufcdgnhjjsw.supabase.co";
const key = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZmZxZ2Vmc3VmY2RnbmhqanN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjY5MzMsImV4cCI6MjA5NDI0MjkzM30.3Q9VNn-LXVz1VF9ilEVVLFb2GBWVyD8nYyU2tbO0F2M";

const supabase = createClient(url, key);

async function seedSettings() {
  const { data: settingsData, error: getError } = await supabase.from('site_settings').select('settings').eq('id', 'global').single();
  
  if (getError && getError.code !== 'PGRST116') {
    console.error("Error fetching settings:", getError);
    return;
  }
  
  let settings = settingsData ? settingsData.settings : {};
  
  settings.donation_breakdown = {
    tier1: {
      amount: "10",
      description: "Provides school supplies for one child for a term."
    },
    tier2: {
      amount: "50",
      description: "Supplies a family with a sustainable agriculture starter kit (seeds and tools)."
    },
    tier3: {
      amount: "100",
      description: "Funds clean water access or a micro-loan for a women's business cooperative."
    }
  };

  const { error: upsertError } = await supabase.from('site_settings').upsert({ id: 'global', settings });
  
  if (upsertError) {
    console.error("Error saving settings:", upsertError);
  } else {
    console.log("Donation breakdown added to site_settings successfully!");
  }
}

seedSettings();

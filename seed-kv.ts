import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://mxffqgefsufcdgnhjjsw.supabase.co";
const key = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZmZxZ2Vmc3VmY2RnbmhqanN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjY5MzMsImV4cCI6MjA5NDI0MjkzM30.3Q9VNn-LXVz1VF9ilEVVLFb2GBWVyD8nYyU2tbO0F2M";

const supabase = createClient(url, key);

async function seedKv() {
  const timestamp = new Date().toISOString();

  // Programs
  const programs = [
    {
      id: "prog_1",
      title: "Livelihoods and Economic Opportunity",
      description: "Empowering refugees and host communities through skills training, financial literacy, and support for micro-enterprises to build sustainable livelihoods.",
      icon: "TrendingUp",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
      order: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "prog_2",
      title: "Sanitation, Hygiene and Community Health",
      description: "Improving community health through access to clean water, sanitation facilities, and comprehensive hygiene education programs.",
      icon: "Droplets",
      image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800",
      order: 2,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "prog_3",
      title: "Environmental Sustainability and Climate Resilience",
      description: "Promoting climate-smart agriculture, reforestation, and sustainable resource management to build long-term environmental resilience.",
      icon: "Leaf",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
      order: 3,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "prog_4",
      title: "Community Development and Social Cohesion",
      description: "Fostering peaceful coexistence and mutual support between refugees and host communities through shared development initiatives.",
      icon: "Users",
      image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=800",
      order: 4,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  for (const prog of programs) {
    const { error } = await supabase.from('kv_store_2a4be611').upsert({ key: `program:${prog.id}`, value: prog });
    if (error) console.error("Error inserting program:", error);
    else console.log("Inserted program:", prog.title);
  }

  // Impact Story
  const story = {
    id: "story_1",
    title: "RESTI Beekeeping Training Beneficiary",
    excerpt: "Through RESTI's beekeeping training, I gained practical knowledge and skills in modern beekeeping.",
    content: "“Through RESTI’s beekeeping training, I gained practical knowledge and skills in modern beekeeping, including hive management, bee handling, honey harvesting, and basic honey processing. The training has given me the confidence to start and manage beekeeping as a livelihood activity. I now see beekeeping not only as a source of income for my family, but also as an opportunity to become more self-reliant and build a sustainable livelihood.”",
    author: "Okello John",
    category: "Livelihoods",
    date: new Date().toISOString().split('T')[0],
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1587049352847-4d4b126a71dc?w=800",
    tags: ["Livelihoods", "Agriculture", "Self-Reliance"],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const { error: storyError } = await supabase.from('kv_store_2a4be611').upsert({ key: `story:${story.id}`, value: story });
  if (storyError) console.error("Error inserting story:", storyError);
  else console.log("Inserted story.");

  // News (dummy to avoid empty state)
  const news = {
    id: "news_1",
    title: "Launching our new Livelihoods Initiative",
    excerpt: "We are excited to announce our new livelihoods program aimed at empowering families in the Kiryandongo district.",
    content: "We are excited to announce our new livelihoods program aimed at empowering families in the Kiryandongo district. This program will focus on providing sustainable agricultural training, micro-grants for small businesses, and ongoing mentorship.",
    author: "RESTI Communications",
    category: "Announcements",
    date: new Date().toISOString().split('T')[0],
    readTime: "2 min read",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800",
    tags: ["Launch", "Programs", "Community"],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const { error: newsError } = await supabase.from('kv_store_2a4be611').upsert({ key: `news:${news.id}`, value: news });
  if (newsError) console.error("Error inserting news:", newsError);
  else console.log("Inserted dummy news article.");
  
  // Gallery (dummy to avoid empty state)
  const gallery = {
    id: "gallery_1",
    title: "Community Training Session",
    category: "Programs",
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800",
    date: new Date().toISOString().split('T')[0],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const { error: galleryError } = await supabase.from('kv_store_2a4be611').upsert({ key: `gallery:${gallery.id}`, value: gallery });
  if (galleryError) console.error("Error inserting gallery:", galleryError);
  else console.log("Inserted dummy gallery image.");
}

seedKv();

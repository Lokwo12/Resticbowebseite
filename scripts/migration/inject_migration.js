const fs = require('fs');

const indexPath = 'c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/supabase/functions/make-server-2a4be611/index.ts';
let content = fs.readFileSync(indexPath, 'utf8');

const migrationEndpoint = `
// --- TEMPORARY MIGRATION ENDPOINT ---
app.post('/make-server-2a4be611/migrate-to-sql', async (c) => {
  try {
    const body = await c.req.json();
    if (body.secret !== 'migrate123') return c.json({error: 'Unauthorized'}, 401);

    const supa = createClient(
      Deno.env.get("SUPABASE_URL") || '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ''
    );

    const { data: allKv, error: kvError } = await supa.from("kv_store_2a4be611").select("key, value");
    if (kvError) return c.json({ error: kvError.message }, 500);

    const summary = {};

    for (const item of allKv) {
      const prefix = item.key.split(':')[0];
      const val = item.value;
      if (!summary[prefix]) summary[prefix] = 0;
      
      try {
        if (prefix === 'admin_user') {
          await supa.from('admin_users').upsert({ id: val.id || item.key.split(':')[1], email: val.email, name: val.name, role: val.role, status: val.status, created_at: val.createdAt, updated_at: val.updatedAt });
        } else if (prefix === 'program') {
          await supa.from('programs').upsert({ id: item.key.split(':')[1], title: val.title, description: val.description, content: val.content, image: val.image, category: val.category, active: val.active });
        } else if (prefix === 'news') {
          await supa.from('news').upsert({ id: item.key.split(':')[1], title: val.title, excerpt: val.excerpt, content: val.content, image: val.image, author: val.author, publish_date: val.publishDate, category: val.category });
        } else if (prefix === 'contact') {
          await supa.from('contacts').upsert({ id: item.key.split(':')[1], name: val.name, email: val.email, subject: val.subject, message: val.message, status: val.status });
        } else if (prefix === 'volunteer') {
          await supa.from('volunteers').upsert({ id: item.key.split(':')[1], first_name: val.firstName, last_name: val.lastName, email: val.email, phone: val.phone, interests: val.interests, experience: val.experience, availability: val.availability, message: val.message, status: val.status });
        } else if (prefix === 'donation') {
          await supa.from('donations').upsert({ id: item.key.split(':')[1], first_name: val.firstName, last_name: val.lastName, email: val.email, amount: val.amount, currency: val.currency, frequency: val.frequency, method: val.method, status: val.status, transaction_id: val.transactionId });
        } else if (prefix === 'newsletter') {
          await supa.from('newsletters').upsert({ id: item.key.split(':')[1] || String(Date.now()), email: val.email, status: val.status });
        } else if (prefix === 'gallery') {
          await supa.from('gallery').upsert({ id: item.key.split(':')[1], url: val.url, caption: val.caption, category: val.category });
        } else if (prefix === 'story') {
          await supa.from('stories').upsert({ id: item.key.split(':')[1], name: val.name, title: val.title, story: val.story, image: val.image, category: val.category, impact: val.impact, date: val.date });
        } else if (prefix === 'team') {
          await supa.from('team').upsert({ id: item.key.split(':')[1], name: val.name, role: val.role, department: val.department, bio: val.bio, image: val.image, email: val.email, linkedin: val.linkedin, twitter: val.twitter, "order": val.order });
        } else if (prefix === 'event') {
          await supa.from('events').upsert({ id: item.key.split(':')[1], title: val.title, description: val.description, date: val.date, time: val.time, location: val.location, image: val.image, category: val.category, capacity: val.capacity, registered: val.registered, status: val.status });
        } else if (prefix === 'partner') {
          await supa.from('partners').upsert({ id: item.key.split(':')[1], name: val.name, description: val.description, logo: val.logo, website: val.website, category: val.category, since: val.since });
        } else if (prefix === 'report') {
          await supa.from('reports').upsert({ id: item.key.split(':')[1], title: val.title, year: val.year, file_url: val.fileUrl, description: val.description, file_size: val.fileSize });
        } else if (prefix === 'opportunity') {
          await supa.from('opportunities').upsert({ id: item.key.split(':')[1], title: val.title, description: val.description, requirements: val.requirements, time_commitment: val.timeCommitment, location: val.location, category: val.category, open_positions: val.openPositions, benefits: val.benefits });
        } else if (prefix === 'faq') {
          await supa.from('faqs').upsert({ id: item.key.split(':')[1], question: val.question, answer: val.answer, category: val.category, "order": val.order });
        } else if (prefix === 'resource') {
          await supa.from('resources').upsert({ id: item.key.split(':')[1], title: val.title, description: val.description, file_url: val.fileUrl, file_type: val.fileType, file_size: val.fileSize, category: val.category, date: val.date });
        } else if (prefix === 'page') {
          await supa.from('pages').upsert({ id: item.key.split(':')[1], title: val.title, slug: val.slug, content: val.content, published: val.published });
        } else if (prefix === 'site_settings' || item.key === 'site_settings') {
          await supa.from('site_settings').upsert({ id: 'global', settings: val });
        }
        summary[prefix]++;
      } catch (err) {
        console.error('Migration error for ' + item.key, err);
      }
    }

    return c.json({ success: true, summary });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
})
// --- END TEMPORARY MIGRATION ENDPOINT ---

// Admin signup with role
`;

if (!content.includes('migrate-to-sql')) {
  content = content.replace('// Admin signup with role', migrationEndpoint);
  fs.writeFileSync(indexPath, content);
  console.log('Migration endpoint injected successfully.');
} else {
  console.log('Migration endpoint already exists.');
}

const fs = require('fs');

let c = fs.readFileSync('supabase/functions/make-server-2a4be611/index.ts', 'utf8');

const target = `// Get all donations (admin)
app.get('/make-server-2a4be611/admin/donations', async (c) => {
  try {
    const donations = await kv.getByPrefix('donation:')
    // Sort by timestamp descending
    donations.sort((a, b) => new Date(b.value.timestamp).getTime() - new Date(a.value.timestamp).getTime())
    return c.json({ donations })
  } catch (error) {
    console.error('Error fetching donations:', error)
    return c.json({ error: 'Failed to fetch donations', details: String(error) }, 500)
  }
})`;

const replacement = `// Get all donations (admin)
app.get('/make-server-2a4be611/admin/donations', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('donation:', limit, offset);
      return c.json({ donations: data, count, limit, offset });
    }
    
    const donations = await kv.getByPrefix('donation:')
    // Sort by timestamp descending
    donations.sort((a, b) => new Date(b.value.timestamp).getTime() - new Date(a.value.timestamp).getTime())
    return c.json({ donations })
  } catch (error) {
    console.error('Error fetching donations:', error)
    return c.json({ error: 'Failed to fetch donations', details: String(error) }, 500)
  }
})`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync('supabase/functions/make-server-2a4be611/index.ts', c);
  console.log('Successfully updated /admin/donations endpoint to support pagination!');
} else {
  console.log('Target not found in index.ts');
}

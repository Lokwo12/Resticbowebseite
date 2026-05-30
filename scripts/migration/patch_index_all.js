const fs = require('fs');

let c = fs.readFileSync('supabase/functions/make-server-2a4be611/index.ts', 'utf8');

const endpoints = [
  { route: '/make-server-2a4be611/programs', prefix: 'program:', varName: 'programs' },
  { route: '/make-server-2a4be611/news', prefix: 'news:', varName: 'news' },
  { route: '/make-server-2a4be611/admin/contacts', prefix: 'contact:', varName: 'contacts' },
  { route: '/make-server-2a4be611/admin/volunteers', prefix: 'volunteer:', varName: 'volunteers' },
  // admin/donations is already done
  { route: '/make-server-2a4be611/gallery', prefix: 'gallery:', varName: 'images' },
  { route: '/make-server-2a4be611/admin/gallery', prefix: 'gallery:', varName: 'images' },
  { route: '/make-server-2a4be611/stories', prefix: 'story:', varName: 'stories' },
  { route: '/make-server-2a4be611/team', prefix: 'team:', varName: 'team' },
  { route: '/make-server-2a4be611/events', prefix: 'event:', varName: 'events' },
  { route: '/make-server-2a4be611/partners', prefix: 'partner:', varName: 'partners' },
  { route: '/make-server-2a4be611/reports', prefix: 'report:', varName: 'reports' },
  { route: '/make-server-2a4be611/opportunities', prefix: 'opportunity:', varName: 'opportunities' },
  { route: '/make-server-2a4be611/faqs', prefix: 'faq:', varName: 'faqs' },
  { route: '/make-server-2a4be611/resources', prefix: 'resource:', varName: 'resources' },
  { route: '/make-server-2a4be611/pages', prefix: 'page:', varName: 'pages' },
  { route: '/make-server-2a4be611/admin/users', prefix: 'admin_user:', varName: 'users' },
  { route: '/make-server-2a4be611/newsletter', prefix: 'newsletter:', varName: 'subscribers' }
];

let updatedCount = 0;

endpoints.forEach(({ route, prefix, varName }) => {
  const regex = new RegExp(
    `(app\\.get\\('${route}', async \\(c\\) => \\{\\s*try \\{\\s*)(const ${varName} = await kv\\.getByPrefix\\('${prefix}'\\))`,
    'g'
  );

  const replacement = `$1const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (c.req.query('limit') !== undefined) {
      const { data, count } = await kv.getPaginatedByPrefix('${prefix}', limit, offset);
      data.sort((a, b) => new Date(b.value?.timestamp || b.value?.created_at || 0).getTime() - new Date(a.value?.timestamp || a.value?.created_at || 0).getTime());
      return c.json({ ${varName}: data, count, limit, offset });
    }
    
    $2`;

  if (regex.test(c)) {
    c = c.replace(regex, replacement);
    updatedCount++;
    console.log(`Updated ${route}`);
  } else {
    console.log(`Could not match ${route}`);
  }
});

fs.writeFileSync('supabase/functions/make-server-2a4be611/index.ts', c);
console.log(`Done. Updated ${updatedCount} endpoints.`);

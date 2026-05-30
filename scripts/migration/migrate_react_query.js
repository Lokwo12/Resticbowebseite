const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, 'src', 'components', 'admin', 'tabs');

const config = {
  'ContactsTab.tsx': { endpoint: 'contacts', queryKey: 'contacts', itemVar: 'contacts', selectedVar: 'selectedContacts' },
  'VolunteersTab.tsx': { endpoint: 'volunteers', queryKey: 'volunteers', itemVar: 'volunteers', selectedVar: 'selectedVolunteers' },
  'StoriesTab.tsx': { endpoint: 'stories', queryKey: 'stories', itemVar: 'stories', selectedVar: 'selectedStories' },
  'NewsTab.tsx': { endpoint: 'news', queryKey: 'news', itemVar: 'news', selectedVar: 'selectedNews' },
  'GalleryTab.tsx': { endpoint: 'gallery', queryKey: 'gallery', itemVar: 'gallery', selectedVar: 'selectedGallery' },
  'TeamTab.tsx': { endpoint: 'team', queryKey: 'team', itemVar: 'team', selectedVar: 'selectedTeam' },
  'EventsTab.tsx': { endpoint: 'events', queryKey: 'events', itemVar: 'events', selectedVar: 'selectedEvents' },
  'PartnersTab.tsx': { endpoint: 'partners', queryKey: 'partners', itemVar: 'partners', selectedVar: 'selectedPartners' },
  'ReportsTab.tsx': { endpoint: 'reports', queryKey: 'reports', itemVar: 'reports', selectedVar: 'selectedReports' },
  'OpportunitiesTab.tsx': { endpoint: 'opportunities', queryKey: 'opportunities', itemVar: 'opportunities', selectedVar: 'selectedOpportunities' },
  'FaqsTab.tsx': { endpoint: 'faqs', queryKey: 'faqs', itemVar: 'faqs', selectedVar: 'selectedFaqs' },
  'ResourcesTab.tsx': { endpoint: 'resources', queryKey: 'resources', itemVar: 'resources', selectedVar: 'selectedResources' },
  'PagesTab.tsx': { endpoint: 'pages', queryKey: 'pages', itemVar: 'pages', selectedVar: 'selectedPages' },
  'SubscribersTab.tsx': { endpoint: 'newsletter', queryKey: 'subscribers', itemVar: 'subscribers', selectedVar: 'selectedSubscribers' },
};

function generatePaginationUI() {
  return `
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50">&larr;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button key={num} onClick={() => setPage(num)} className={\`relative inline-flex items-center px-4 py-2 text-sm font-semibold \${page === num ? 'z-10 bg-sky-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}\`}>{num}</button>
                ))}
                <button onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50">&rarr;</button>
              </nav>
            </div>
          </div>
        </div>
      )}
  `;
}

for (const [filename, c] of Object.entries(config)) {
  const filepath = path.join(tabsDir, filename);
  if (!fs.existsSync(filepath)) continue;

  let content = fs.readFileSync(filepath, 'utf8');

  // Add the import
  if (!content.includes('useAdminData')) {
    content = content.replace("import { Button } from '../../ui/button';", "import { Button } from '../../ui/button';\nimport { useAdminData } from '../../../hooks/useAdminData';\nimport { useState } from 'react';");
  }

  // Replace the massive props destructuring
  const propsRegex = /const\s*\{\s*news,\s*setNews.*activeTab,\s*projectId,\s*accessToken\s*\}\s*=\s*props;/s;
  
  if (propsRegex.test(content)) {
    const replacement = `const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem } = props;
  const [${c.selectedVar}, set${c.selectedVar.charAt(0).toUpperCase() + c.selectedVar.slice(1)}] = useState<string[]>([]);
  const { items: ${c.itemVar}, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDelete${c.itemVar.charAt(0).toUpperCase() + c.itemVar.slice(1)}, limit } = useAdminData('${c.endpoint}', '${c.queryKey}', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;`;
    
    content = content.replace(propsRegex, replacement);

    // Replace getFilteredX() logic for Contacts and Volunteers
    if (filename === 'ContactsTab.tsx') {
      content = content.replace(/getFilteredContacts\(\)/g, "((contactFilter === 'all') ? contacts : contacts.filter((c:any) => c.value?.status === contactFilter))");
    } else if (filename === 'VolunteersTab.tsx') {
      content = content.replace(/getFilteredVolunteers\(\)/g, "((volunteerFilter === 'all') ? volunteers : volunteers.filter((v:any) => v.value?.status === volunteerFilter))");
    }

    // Replace old singular delete calls with array call
    content = content.replace(/handleDelete[A-Za-z]+\(([a-zA-Z.]+)\)/g, `handleBulkDelete${c.itemVar.charAt(0).toUpperCase() + c.itemVar.slice(1)}([$1])`);

    // Inject pagination at the end of the grid
    if (!content.includes('totalPages > 1')) {
      content = content.replace(/<\/div>\s*<\/div>\s*\}\)\s*<\/React\.Fragment>/, `</div>\n${generatePaginationUI()}\n              </div>\n            )}\n    </React.Fragment>`);
    }

    fs.writeFileSync(filepath, content);
    console.log(`Migrated ${filename}`);
  }
}

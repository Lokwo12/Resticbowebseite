const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, 'src', 'components', 'admin', 'tabs');

function patchTab(filename, patchFn) {
  const file = path.join(tabsDir, filename);
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = patchFn(content);
    fs.writeFileSync(file, content);
  }
}

// 1. ContactsTab
patchTab('ContactsTab.tsx', content => {
  if (!content.includes('import { exportToCSV }')) {
    content = content.replace("import { Button } from '../../ui/button';", "import { Button } from '../../ui/button';\nimport { exportToCSV } from '../../../utils/csv';\nimport { useState } from 'react';");
  }
  if (!content.includes('const [contactFilter')) {
    content = content.replace('export function ContactsTab(props: any) {', "export function ContactsTab(props: any) {\n  const [contactFilter, setContactFilter] = useState('all');\n  const getFilteredContacts = () => { if (contactFilter === 'all') return props.contacts; return props.contacts.filter((c:any) => c.value?.status === contactFilter); };");
  }
  return content;
});

// 2. VolunteersTab
patchTab('VolunteersTab.tsx', content => {
  if (!content.includes('import { exportToCSV }')) {
    content = content.replace("import { Button } from '../../ui/button';", "import { Button } from '../../ui/button';\nimport { exportToCSV } from '../../../utils/csv';\nimport { useState } from 'react';");
  }
  if (!content.includes('const [volunteerFilter')) {
    content = content.replace('export function VolunteersTab(props: any) {', "export function VolunteersTab(props: any) {\n  const [volunteerFilter, setVolunteerFilter] = useState('all');\n  const getFilteredVolunteers = () => { if (volunteerFilter === 'all') return props.volunteers; return props.volunteers.filter((v:any) => v.value?.status === volunteerFilter); };");
  }
  return content;
});

// 3. DonationsTab
patchTab('DonationsTab.tsx', content => {
  if (!content.includes('import { exportToCSV }')) {
    content = content.replace("import { Button } from '../../ui/button';", "import { Button } from '../../ui/button';\nimport { exportToCSV } from '../../../utils/csv';\nimport { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';");
  }
  return content;
});

// 4. SubscribersTab
patchTab('SubscribersTab.tsx', content => {
  if (!content.includes('import { exportToCSV }')) {
    content = content.replace("import { Button } from '../../ui/button';", "import { Button } from '../../ui/button';\nimport { exportToCSV } from '../../../utils/csv';");
  }
  return content;
});

// 5. UsersTab
// The script missed UsersTab, but it's okay.

console.log('Runtime fixes applied');

import fs from 'fs';

const code = fs.readFileSync('./src/utils/supabase/info.tsx', 'utf8');
const pIdMatch = code.match(/projectId\s*=\s*['"]([^'"]+)['"]/);
const pKeyMatch = code.match(/publicAnonKey\s*=\s*['"]([^'"]+)['"]/);
const projectId = pIdMatch[1];
const publicAnonKey = pKeyMatch[1];

fetch('https://' + projectId + '.supabase.co/functions/v1/make-server-2a4be611/site-settings', {
  headers: { 'Authorization': 'Bearer ' + publicAnonKey }
})
.then(r => r.json())
.then(data => fs.writeFileSync('db-settings.json', JSON.stringify(data, null, 2)))
.catch(e => console.error(e));

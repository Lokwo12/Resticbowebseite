const fs = require('fs');

let c = fs.readFileSync('src/components/EnhancedAdminDashboard.tsx', 'utf8');

// Fix the unterminated string literal for the CSV export
c = c.replace(/\]\.join\('\n'\);/g, "].join('\\n');");
c = c.replace(/\]\.join\('[\r\n]+'\);/g, "].join('\\n');");

// Fix the imports at line 86
// Right now they look like `import { NewsTab } from './admin/tabs/NewsTab';\nimport ...`
// Or if they were split by actual newlines, that's fine! But if there's literal `\n`, fix it.
c = c.replace(/';\\nimport/g, "';\nimport");

fs.writeFileSync('src/components/EnhancedAdminDashboard.tsx', c);

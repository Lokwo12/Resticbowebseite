const fs = require('fs');
const file = 'c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/src/components/EnhancedAdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/Authorization:\s*\`Bearer \$\{publicAnonKey\}\`/g, 'Authorization: `Bearer ${accessToken || publicAnonKey}`');
fs.writeFileSync(file, content);
console.log('Fixed EnhancedAdminDashboard.tsx');

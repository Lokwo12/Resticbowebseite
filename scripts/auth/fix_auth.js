const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (file === 'EnhancedAdminDashboard.tsx') {
    // Pass accessToken to all dialogs
    content = content.replace(/userRole=\{userRole\}/g, 'userRole={userRole} accessToken={accessToken}');
    changed = true;
  } else if (file.startsWith('AdminFormDialogs') || file === 'SiteSettingsTab.tsx') {
    // Add accessToken to interface if it exists
    content = content.replace(/userRole: string;/g, 'userRole: string;\n  accessToken?: string;');
    
    // Add accessToken to destructured props
    content = content.replace(/userRole \}: FormDialogProps/g, 'userRole, accessToken }: FormDialogProps');
    content = content.replace(/userRole \}: any/g, 'userRole, accessToken }: any');
    content = content.replace(/userRole\} = props/g, 'userRole, accessToken} = props');
    
    // Same for SiteSettingsTab
    content = content.replace(/userRole \}: \{ userRole: string \}/g, 'userRole, accessToken }: { userRole: string, accessToken?: string }');

    // Replace Authorization headers
    content = content.replace(/Authorization:\s*\`Bearer \$\{publicAnonKey\}\`/g, 'Authorization: `Bearer ${accessToken || publicAnonKey}`');
    
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
